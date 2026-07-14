using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DayEnd;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class DayEndService : IDayEndService
{
    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;

    public DayEndService(ApplicationDbContext context, IDayLockService dayLockService)
    {
        _context = context;
        _dayLockService = dayLockService;
    }

    private static DateTime NormalizeProcessDate(DateTime d) =>
        DateTime.SpecifyKind(d.Date, DateTimeKind.Utc);

    public async Task<DayEndContextDto> GetContextAsync(DateTime processDate, CancellationToken cancellationToken = default)
    {
        var pd = NormalizeProcessDate(processDate);
        var dayStart = pd;
        var dayEnd = pd.AddDays(1);

        var cashierRow = await _context.CashierBalanceDays
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);

        var dayLocked = await _dayLockService.IsDateLockedAsync(pd, cancellationToken);
        var lastDayEnd = await _dayLockService.GetLastDayEndDateAsync(cancellationToken);

        var outlets = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.DisplayOrder)
            .ThenBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var completedOutletIds = await _context.DayEndOutletLines
            .AsNoTracking()
            .Where(l => l.ProcessDate == pd)
            .Select(l => l.OutletId)
            .Distinct()
            .ToListAsync(cancellationToken);
        var completedSet = completedOutletIds.ToHashSet();

        var deliveryTotals = await _context.Deliveries
            .AsNoTracking()
            .Where(d =>
                d.IsActive &&
                d.DeliveryDate >= dayStart &&
                d.DeliveryDate < dayEnd &&
                d.Status == DeliveryStatus.Approved)
            .GroupBy(d => d.OutletId)
            .Select(g => new { OutletId = g.Key, Total = g.Sum(x => x.TotalValue) })
            .ToDictionaryAsync(x => x.OutletId, x => x.Total, cancellationToken);

        var rows = new List<DayEndOutletRowDto>();
        foreach (var outlet in outlets)
        {
            var systemBalance = deliveryTotals.GetValueOrDefault(outlet.Id, 0m);
            rows.Add(new DayEndOutletRowDto
            {
                OutletId = outlet.Id,
                OutletName = outlet.Name,
                SystemBalance = systemBalance,
                RowStatus = completedSet.Contains(outlet.Id) ? "Completed" : "Pending",
            });
        }

        return new DayEndContextDto
        {
            ProcessDate = pd,
            CashierBalanceApproved = cashierRow is { IsApproved: true, IsSubmitted: true },
            DayLocked = dayLocked,
            LastDayEndProcessDate = lastDayEnd?.ToString("yyyy-MM-dd"),
            Outlets = rows,
        };
    }

    public async Task<IReadOnlyList<DayEndCashierOptionDto>> GetCashiersForOutletAsync(Guid outletId, CancellationToken cancellationToken = default)
    {
        return await _context.OutletEmployees
            .AsNoTracking()
            .Where(e => e.OutletId == outletId && e.IsActive)
            .OrderBy(e => e.FullName ?? e.FirstName)
            .Select(e => new DayEndCashierOptionDto
            {
                OutletEmployeeId = e.Id,
                DisplayName = e.FullName ?? ($"{e.FirstName} {e.LastName}".Trim()),
            })
            .ToListAsync(cancellationToken);
    }

    public async Task ApproveCashierBalanceForDateAsync(DateTime processDate, Guid approvedByUserId, CancellationToken cancellationToken = default)
    {
        var pd = NormalizeProcessDate(processDate);
        var row = await _context.CashierBalanceDays.FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);
        if (row is not { IsSubmitted: true })
        {
            throw new InvalidOperationException("Cashier balance must be submitted for this date before it can be approved.");
        }

        var now = DateTime.UtcNow;
        row.IsApproved = true;
        row.ApprovedById = approvedByUserId;
        row.ApprovedAt = now;
        row.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SubmitDayEndAsync(SubmitDayEndDto dto, Guid submittedByUserId, CancellationToken cancellationToken = default)
    {
        if (dto.Lines == null || dto.Lines.Count == 0)
        {
            throw new InvalidOperationException("At least one showroom line is required.");
        }

        var pd = NormalizeProcessDate(dto.ProcessDate);

        if (await _dayLockService.IsDateLockedAsync(pd, cancellationToken))
        {
            throw new InvalidOperationException("The selected date is day-locked. Day-End Process cannot be performed.");
        }

        var cashier = await _context.CashierBalanceDays.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);
        if (cashier is not { IsSubmitted: true, IsApproved: true })
        {
            throw new InvalidOperationException("Cashier balance must be submitted and approved for this date before running day-end.");
        }

        var dayStart = pd;
        var dayEnd = pd.AddDays(1);

        foreach (var line in dto.Lines)
        {
            var outlet = await _context.Outlets.FirstOrDefaultAsync(o => o.Id == line.OutletId && o.IsActive, cancellationToken);
            if (outlet == null)
            {
                throw new InvalidOperationException($"Outlet '{line.OutletId}' was not found or is inactive.");
            }

            var employee = await _context.OutletEmployees.FirstOrDefaultAsync(
                e => e.Id == line.OutletEmployeeId && e.OutletId == line.OutletId && e.IsActive,
                cancellationToken);
            if (employee == null)
            {
                throw new InvalidOperationException($"Cashier is not valid for outlet '{outlet.Name}'.");
            }

            var systemBalance = await _context.Deliveries
                .Where(d =>
                    d.IsActive &&
                    d.OutletId == line.OutletId &&
                    d.DeliveryDate >= dayStart &&
                    d.DeliveryDate < dayEnd &&
                    d.Status == DeliveryStatus.Approved)
                .SumAsync(d => d.TotalValue, cancellationToken);

            var existing = await _context.DayEndOutletLines
                .FirstOrDefaultAsync(l => l.ProcessDate == pd && l.OutletId == line.OutletId, cancellationToken);

            var now = DateTime.UtcNow;
            if (existing != null)
            {
                existing.OutletEmployeeId = line.OutletEmployeeId;
                existing.CashierBalance = line.CashierBalance;
                existing.SystemBalance = systemBalance;
                existing.CreatedAt = now;
                existing.CreatedById = submittedByUserId;
            }
            else
            {
                _context.DayEndOutletLines.Add(new DayEndOutletLine
                {
                    Id = Guid.NewGuid(),
                    ProcessDate = pd,
                    OutletId = line.OutletId,
                    OutletEmployeeId = line.OutletEmployeeId,
                    CashierBalance = line.CashierBalance,
                    SystemBalance = systemBalance,
                    CreatedAt = now,
                    CreatedById = submittedByUserId,
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var activeOutletCount = await _context.Outlets.CountAsync(o => o.IsActive, cancellationToken);
        var distinctSubmitted = await _context.DayEndOutletLines
            .Where(l => l.ProcessDate == pd)
            .Select(l => l.OutletId)
            .Distinct()
            .CountAsync(cancellationToken);

        if (distinctSubmitted >= activeOutletCount && activeOutletCount > 0)
        {
            await _dayLockService.LockDateAsync(pd, submittedByUserId, cancellationToken);
        }
    }
}
