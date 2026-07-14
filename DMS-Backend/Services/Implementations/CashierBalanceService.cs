using System.Text.Json;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.ApprovalQueue;
using DMS_Backend.Models.DTOs.CashierBalance;
using DMS_Backend.Models.DTOs.DayEnd;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class CashierBalanceService : ICashierBalanceService
{
    public const string ShowroomClosedApprovalType = "CashierBalanceShowroomClosed";

    private readonly ApplicationDbContext _context;
    private readonly IApprovalQueueService _approvalQueueService;

    public CashierBalanceService(ApplicationDbContext context, IApprovalQueueService approvalQueueService)
    {
        _context = context;
        _approvalQueueService = approvalQueueService;
    }

    private static DateTime NormalizeProcessDate(DateTime d) =>
        DateTime.SpecifyKind(d.Date, DateTimeKind.Utc);

    /// <summary>
    /// Sum of channel fields when any is supplied; otherwise legacy <see cref="SubmitCashierBalanceLineDto.CashierBalance"/>.
    /// </summary>
    private static decimal GetDeclaredLineTotal(SubmitCashierBalanceLineDto line)
    {
        var anyChannel =
            line.BalanceCash is not null
            || line.BalanceCard is not null
            || line.BalanceUber is not null
            || line.BalancePickme is not null;
        if (anyChannel)
        {
            return (line.BalanceCash ?? 0m)
                + (line.BalanceCard ?? 0m)
                + (line.BalanceUber ?? 0m)
                + (line.BalancePickme ?? 0m);
        }

        return line.CashierBalance ?? 0m;
    }

    private static void ApplyChannelAmounts(CashierBalanceOutletLine entity, SubmitCashierBalanceLineDto line, decimal total)
    {
        var anyChannel =
            line.BalanceCash is not null
            || line.BalanceCard is not null
            || line.BalanceUber is not null
            || line.BalancePickme is not null;
        if (anyChannel)
        {
            entity.BalanceCash = line.BalanceCash ?? 0m;
            entity.BalanceCard = line.BalanceCard ?? 0m;
            entity.BalanceUber = line.BalanceUber ?? 0m;
            entity.BalancePickme = line.BalancePickme ?? 0m;
        }
        else
        {
            entity.BalanceCash = null;
            entity.BalanceCard = null;
            entity.BalanceUber = null;
            entity.BalancePickme = null;
        }

        entity.CashierBalance = total;
    }

    public async Task<CashierBalanceContextDto> GetContextAsync(DateTime processDate, CancellationToken cancellationToken = default)
    {
        var pd = NormalizeProcessDate(processDate);

        var dayRow = await _context.CashierBalanceDays
            .AsNoTracking()
            .Include(d => d.SubmittedBy)
            .FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);

        var outlets = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.DisplayOrder)
            .ThenBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var lines = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Where(l => l.ProcessDate == pd)
            .ToDictionaryAsync(l => l.OutletId, cancellationToken);

        var rows = outlets.Select(outlet =>
        {
            lines.TryGetValue(outlet.Id, out var line);
            return new CashierBalanceOutletRowDto
            {
                OutletId = outlet.Id,
                Code = outlet.Code,
                Name = outlet.Name,
                IsShowroomClosed = line?.IsShowroomClosed ?? false,
                OutletEmployeeId = line?.OutletEmployeeId,
                CashierBalance = line?.CashierBalance,
                BalanceCash = line?.BalanceCash,
                BalanceCard = line?.BalanceCard,
                BalanceUber = line?.BalanceUber,
                BalancePickme = line?.BalancePickme,
            };
        }).ToList();

        return new CashierBalanceContextDto
        {
            ProcessDate = pd,
            IsSubmitted = dayRow?.IsSubmitted == true,
            IsApproved = dayRow?.IsApproved == true,
            SubmittedAt = dayRow?.SubmittedAt,
            SubmittedByName = dayRow?.SubmittedBy?.FullName ?? dayRow?.SubmittedBy?.Email,
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

    public async Task SubmitAsync(SubmitCashierBalanceDto dto, Guid submittedByUserId, CancellationToken cancellationToken = default)
    {
        if (dto.Lines == null || dto.Lines.Count == 0)
        {
            throw new InvalidOperationException("At least one showroom line is required.");
        }

        var pd = NormalizeProcessDate(dto.ProcessDate);

        var existingDay = await _context.CashierBalanceDays
            .FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);
        if (existingDay is { IsSubmitted: true })
        {
            throw new InvalidOperationException("Cashier balance for this date has already been submitted and cannot be changed.");
        }

        var outletDict = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .ToDictionaryAsync(o => o.Id, cancellationToken);

        if (outletDict.Count == 0)
        {
            throw new InvalidOperationException("No active showrooms are configured.");
        }

        if (dto.Lines.Count != outletDict.Count || dto.Lines.Any(l => !outletDict.ContainsKey(l.OutletId)))
        {
            throw new InvalidOperationException("All active showrooms must be included exactly once.");
        }

        foreach (var line in dto.Lines)
        {
            if (line.IsShowroomClosed)
            {
                continue;
            }

            if (line.OutletEmployeeId is null || line.OutletEmployeeId == Guid.Empty)
            {
                throw new InvalidOperationException("Cashier is required for open showrooms.");
            }

            var declared = GetDeclaredLineTotal(line);
            if (declared <= 0)
            {
                throw new InvalidOperationException("Cashier balance (cash, card, Uber, PickMe) must be greater than zero for open showrooms.");
            }

            var employeeOk = await _context.OutletEmployees.AsNoTracking()
                .AnyAsync(e => e.Id == line.OutletEmployeeId && e.OutletId == line.OutletId && e.IsActive, cancellationToken);
            if (!employeeOk)
            {
                throw new InvalidOperationException("One or more selected cashiers are invalid for their showroom.");
            }
        }

        var now = DateTime.UtcNow;

        if (existingDay == null)
        {
            existingDay = new CashierBalanceDay
            {
                Id = Guid.NewGuid(),
                ProcessDate = pd,
                IsSubmitted = true,
                SubmittedAt = now,
                SubmittedById = submittedByUserId,
                IsApproved = false,
                ApprovedById = null,
                ApprovedAt = null,
                CreatedAt = now,
                UpdatedAt = now,
            };
            _context.CashierBalanceDays.Add(existingDay);
        }
        else
        {
            existingDay.IsSubmitted = true;
            existingDay.SubmittedAt = now;
            existingDay.SubmittedById = submittedByUserId;
            existingDay.IsApproved = false;
            existingDay.ApprovedById = null;
            existingDay.ApprovedAt = null;
            existingDay.UpdatedAt = now;
        }

        var closedForApprovals = new List<(Guid LineId, Guid OutletId, string OutletCode, string OutletName)>();

        foreach (var line in dto.Lines)
        {
            var outlet = outletDict[line.OutletId];
            var existingLine = await _context.CashierBalanceOutletLines
                .FirstOrDefaultAsync(l => l.ProcessDate == pd && l.OutletId == line.OutletId, cancellationToken);

            if (line.IsShowroomClosed)
            {
                if (existingLine == null)
                {
                    var newId = Guid.NewGuid();
                    _context.CashierBalanceOutletLines.Add(new CashierBalanceOutletLine
                    {
                        Id = newId,
                        ProcessDate = pd,
                        OutletId = line.OutletId,
                        IsShowroomClosed = true,
                        OutletEmployeeId = null,
                        CashierBalance = null,
                        BalanceCash = null,
                        BalanceCard = null,
                        BalanceUber = null,
                        BalancePickme = null,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                    closedForApprovals.Add((newId, outlet.Id, outlet.Code, outlet.Name));
                }
                else
                {
                    existingLine.IsShowroomClosed = true;
                    existingLine.OutletEmployeeId = null;
                    existingLine.CashierBalance = null;
                    existingLine.BalanceCash = null;
                    existingLine.BalanceCard = null;
                    existingLine.BalanceUber = null;
                    existingLine.BalancePickme = null;
                    existingLine.UpdatedAt = now;
                    closedForApprovals.Add((existingLine.Id, outlet.Id, outlet.Code, outlet.Name));
                }
            }
            else if (existingLine == null)
            {
                var total = GetDeclaredLineTotal(line);
                var newLine = new CashierBalanceOutletLine
                {
                    Id = Guid.NewGuid(),
                    ProcessDate = pd,
                    OutletId = line.OutletId,
                    IsShowroomClosed = false,
                    OutletEmployeeId = line.OutletEmployeeId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                ApplyChannelAmounts(newLine, line, total);
                _context.CashierBalanceOutletLines.Add(newLine);
            }
            else
            {
                var total = GetDeclaredLineTotal(line);
                existingLine.IsShowroomClosed = false;
                existingLine.OutletEmployeeId = line.OutletEmployeeId;
                existingLine.UpdatedAt = now;
                ApplyChannelAmounts(existingLine, line, total);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var (lineId, outletId, code, name) in closedForApprovals)
        {
            var requestPayload = new
            {
                processDate = pd.ToString("yyyy-MM-dd"),
                outletId,
                outletCode = code,
                outletName = name,
            };

            await _approvalQueueService.CreateAsync(
                new CreateApprovalQueueDto
                {
                    ApprovalType = ShowroomClosedApprovalType,
                    EntityId = lineId,
                    EntityReference = $"{code} - {pd:yyyy-MM-dd}",
                    RequestedById = submittedByUserId,
                    RequestData = JsonSerializer.Serialize(requestPayload),
                    Priority = 0,
                    Notes = "Showroom closed for cashier balance date.",
                    IsActive = true,
                },
                submittedByUserId,
                cancellationToken);
        }
    }

    public async Task<IReadOnlyList<CashierBalanceRecentSubmissionDto>> GetRecentSubmissionsAsync(int count, CancellationToken cancellationToken = default)
    {
        var take = Math.Clamp(count, 1, 50);
        var days = await _context.CashierBalanceDays
            .AsNoTracking()
            .Where(d => d.IsSubmitted && d.SubmittedAt != null)
            .Include(d => d.SubmittedBy)
            .OrderByDescending(d => d.SubmittedAt)
            .Take(take)
            .ToListAsync(cancellationToken);

        if (days.Count == 0)
        {
            return Array.Empty<CashierBalanceRecentSubmissionDto>();
        }

        var processDates = days.Select(d => d.ProcessDate).Distinct().ToList();
        var allLines = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Where(l => processDates.Contains(l.ProcessDate))
            .ToListAsync(cancellationToken);

        var grouped = allLines.GroupBy(l => l.ProcessDate).ToDictionary(g => g.Key, g => g.ToList());

        return days.Select(d =>
        {
            grouped.TryGetValue(d.ProcessDate, out var lines);
            lines ??= new List<CashierBalanceOutletLine>();
            var closedCount = lines.Count(x => x.IsShowroomClosed);
            var total = lines.Where(x => !x.IsShowroomClosed && x.CashierBalance.HasValue).Sum(x => x.CashierBalance!.Value);
            return new CashierBalanceRecentSubmissionDto
            {
                ProcessDate = d.ProcessDate,
                SubmittedAt = d.SubmittedAt ?? d.CreatedAt,
                SubmittedByName = d.SubmittedBy?.FullName ?? d.SubmittedBy?.Email,
                ClosedShowroomCount = closedCount,
                TotalBalance = total,
            };
        }).ToList();
    }
}
