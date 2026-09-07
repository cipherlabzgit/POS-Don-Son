using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.SaleRecords;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class SaleRecordsService : ISaleRecordsService
{
    public static readonly Guid SettingsRowId = Guid.Parse("9a1c0e20-7b44-4d3a-9c11-000000000001");

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;

    public SaleRecordsService(ApplicationDbContext context, IDayLockService dayLockService)
    {
        _context = context;
        _dayLockService = dayLockService;
    }

    private static DateTime NormalizeDate(DateTime d) =>
        DateTime.SpecifyKind(d.Date, DateTimeKind.Utc);

    private static string DayName(int weekStartDay) =>
        Enum.GetName(typeof(DayOfWeek), weekStartDay) ?? "Wednesday";

    private static string Iso(DateOnly d) => d.ToString("yyyy-MM-dd");

    private static DateOnly WeekStartOnOrBefore(DateOnly date, DayOfWeek start)
    {
        var diff = ((int)date.DayOfWeek - (int)start + 7) % 7;
        return date.AddDays(-diff);
    }

    public async Task<SaleRecordsSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var row = await EnsureSettingsRowAsync(cancellationToken);
        return ToDto(row);
    }

    public async Task<SaleRecordsSettingsDto> UpdateSettingsAsync(
        UpdateSaleRecordsSettingsDto dto,
        Guid updatedByUserId,
        CancellationToken cancellationToken = default)
    {
        if (dto.WeekStartDay is < 0 or > 6)
        {
            throw new InvalidOperationException("Cashier turn week start must be Sunday (0) through Saturday (6).");
        }

        if (dto.WeeksToShow is < 1 or > 12)
        {
            throw new InvalidOperationException("Past sale weeks to allow on POS must be between 1 and 12.");
        }

        var row = await EnsureSettingsRowAsync(cancellationToken);
        row.WeekStartDay = dto.WeekStartDay;
        row.WeeksToShow = dto.WeeksToShow;
        row.UpdatedAt = DateTime.UtcNow;
        row.UpdatedById = updatedByUserId;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDto(row);
    }

    public async Task<IReadOnlyList<SaleRecordNotifyTargetDto>> GetNotifyTargetsAsync(
        DateTime processDate,
        CancellationToken cancellationToken = default)
    {
        var pd = NormalizeDate(processDate);
        if (!await _dayLockService.IsDateLockedAsync(pd, cancellationToken))
        {
            throw new InvalidOperationException("Notify To Cashier is only available when the selected date is day-locked.");
        }

        var outlets = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.DisplayOrder)
            .ThenBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var dayEndLines = await _context.DayEndOutletLines
            .AsNoTracking()
            .Include(l => l.OutletEmployee)
            .Where(l => l.ProcessDate >= pd && l.ProcessDate < pd.AddDays(1))
            .ToListAsync(cancellationToken);
        var dayEndByOutlet = dayEndLines
            .GroupBy(l => l.OutletId)
            .ToDictionary(g => g.Key, g => g.First());

        var cashLines = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Include(l => l.OutletEmployee)
            .Where(l => l.ProcessDate >= pd && l.ProcessDate < pd.AddDays(1))
            .ToListAsync(cancellationToken);
        var cashByOutlet = cashLines
            .GroupBy(l => l.OutletId)
            .ToDictionary(g => g.Key, g => g.First());

        var notifiedIds = await _context.CashierSaleNotifications
            .AsNoTracking()
            .Where(n => n.ProcessDate >= pd && n.ProcessDate < pd.AddDays(1))
            .Select(n => n.OutletId)
            .ToListAsync(cancellationToken);
        var notified = notifiedIds.ToHashSet();

        var result = new List<SaleRecordNotifyTargetDto>();
        foreach (var outlet in outlets)
        {
            dayEndByOutlet.TryGetValue(outlet.Id, out var dayEnd);
            cashByOutlet.TryGetValue(outlet.Id, out var cash);
            var employee = dayEnd?.OutletEmployee ?? cash?.OutletEmployee;
            var employeeId = dayEnd?.OutletEmployeeId ?? cash?.OutletEmployeeId;
            var name = employee == null
                ? ""
                : (employee.FullName ?? $"{employee.FirstName} {employee.LastName}".Trim());

            result.Add(new SaleRecordNotifyTargetDto
            {
                OutletId = outlet.Id,
                OutletName = outlet.Name,
                OutletEmployeeId = employeeId,
                CashierName = string.IsNullOrWhiteSpace(name) ? "—" : name,
                AlreadyNotified = notified.Contains(outlet.Id),
                CanNotify = employeeId.HasValue && employeeId.Value != Guid.Empty,
                Status = "Locked",
            });
        }

        return result;
    }

    public async Task NotifyCashiersAsync(
        NotifyCashiersDto dto,
        Guid notifiedByUserId,
        CancellationToken cancellationToken = default)
    {
        if (dto.OutletIds == null || dto.OutletIds.Count == 0)
        {
            throw new InvalidOperationException("Select at least one showroom.");
        }

        var pd = NormalizeDate(dto.ProcessDate);
        if (!await _dayLockService.IsDateLockedAsync(pd, cancellationToken))
        {
            throw new InvalidOperationException("Notify To Cashier is only available when the selected date is day-locked.");
        }

        var uniqueOutletIds = dto.OutletIds.Distinct().ToList();
        var existing = await _context.CashierSaleNotifications
            .Where(n => n.ProcessDate >= pd && n.ProcessDate < pd.AddDays(1) && uniqueOutletIds.Contains(n.OutletId))
            .ToListAsync(cancellationToken);

        if (existing.Count > 0 && !dto.ConfirmRenotify)
        {
            throw new InvalidOperationException(
                "One or more selected showrooms were already notified. Confirm to notify them again.");
        }

        var now = DateTime.UtcNow;
        foreach (var outletId in uniqueOutletIds)
        {
            var snapshot = await BuildSnapshotAsync(pd, outletId, cancellationToken);
            var row = existing.FirstOrDefault(e => e.OutletId == outletId);
            if (row == null)
            {
                row = new CashierSaleNotification
                {
                    Id = Guid.NewGuid(),
                    ProcessDate = pd,
                    OutletId = outletId,
                };
                _context.CashierSaleNotifications.Add(row);
            }

            row.OutletEmployeeId = snapshot.OutletEmployeeId;
            row.CashierUserId = snapshot.CashierUserId;
            row.OutletName = snapshot.OutletName;
            row.ShowroomSale = snapshot.ShowroomSale;
            row.SystemSale = snapshot.SystemSale;
            row.Difference = snapshot.ShowroomSale - snapshot.SystemSale;
            row.NotifiedAt = now;
            row.NotifiedById = notifiedByUserId;
            row.IsRead = false;
            row.ReadAt = null;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PosSaleRecordsUnreadDto> GetUnreadCountAsync(
        Guid cashierUserId,
        CancellationToken cancellationToken = default)
    {
        var employeeIds = await GetCashierEmployeeIdsAsync(cashierUserId, cancellationToken);
        var count = await _context.CashierSaleNotifications
            .AsNoTracking()
            .Where(n => !n.IsRead && (
                n.CashierUserId == cashierUserId ||
                employeeIds.Contains(n.OutletEmployeeId)))
            .CountAsync(cancellationToken);

        return new PosSaleRecordsUnreadDto { UnreadCount = count };
    }

    public async Task<PosSaleRecordsDto> GetPosRecordsAsync(
        Guid cashierUserId,
        CancellationToken cancellationToken = default)
    {
        var settings = await EnsureSettingsRowAsync(cancellationToken);
        var today = DeliveryPlanPreloadRules.TodaySriLanka();
        var weekStart = (DayOfWeek)settings.WeekStartDay;
        var currentStart = WeekStartOnOrBefore(today, weekStart);
        var oldestStart = currentStart.AddDays(-7 * (settings.WeeksToShow - 1));
        var newestEnd = currentStart.AddDays(6);

        var fromDt = NormalizeDate(oldestStart.ToDateTime(TimeOnly.MinValue));
        var toDt = NormalizeDate(newestEnd.ToDateTime(TimeOnly.MinValue));

        var employeeIds = await GetCashierEmployeeIdsAsync(cashierUserId, cancellationToken);
        var notes = await _context.CashierSaleNotifications
            .AsNoTracking()
            .Where(n =>
                n.ProcessDate >= fromDt &&
                n.ProcessDate <= toDt &&
                (n.CashierUserId == cashierUserId || employeeIds.Contains(n.OutletEmployeeId)))
            .ToListAsync(cancellationToken);

        var byDate = notes
            .GroupBy(n => DateOnly.FromDateTime(n.ProcessDate))
            .ToDictionary(g => g.Key, g => g.ToList());

        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == cashierUserId, cancellationToken);
        var cashierName = user == null
            ? ""
            : $"{user.FirstName} {user.LastName}".Trim();

        var weeks = new List<PosSaleRecordWeekDto>();
        for (var i = settings.WeeksToShow - 1; i >= 0; i--)
        {
            var start = currentStart.AddDays(-7 * i);
            var end = start.AddDays(6);
            var days = new List<PosSaleRecordDayDto>();
            decimal total = 0m;

            for (var d = start; d <= end; d = d.AddDays(1))
            {
                if (!byDate.TryGetValue(d, out var rows) || rows.Count == 0)
                {
                    days.Add(new PosSaleRecordDayDto
                    {
                        Date = Iso(d),
                        Difference = null,
                        ShowroomName = null,
                        Available = false,
                    });
                    continue;
                }

                foreach (var row in rows.OrderBy(r => r.OutletName))
                {
                    days.Add(new PosSaleRecordDayDto
                    {
                        Date = Iso(d),
                        Difference = row.Difference,
                        ShowroomName = row.OutletName,
                        Available = true,
                    });
                    total += row.Difference;
                }
            }

            weeks.Add(new PosSaleRecordWeekDto
            {
                WeekStart = Iso(start),
                WeekEnd = Iso(end),
                Total = total,
                Days = days,
            });
        }

        var unread = await GetUnreadCountAsync(cashierUserId, cancellationToken);

        return new PosSaleRecordsDto
        {
            CashierName = cashierName,
            WeekStartDay = settings.WeekStartDay,
            WeeksToShow = settings.WeeksToShow,
            PeriodStart = Iso(oldestStart),
            PeriodEnd = Iso(newestEnd),
            UnreadCount = unread.UnreadCount,
            Weeks = weeks,
        };
    }

    public async Task MarkReadAsync(Guid cashierUserId, CancellationToken cancellationToken = default)
    {
        var employeeIds = await GetCashierEmployeeIdsAsync(cashierUserId, cancellationToken);
        var now = DateTime.UtcNow;
        var rows = await _context.CashierSaleNotifications
            .Where(n => !n.IsRead && (
                n.CashierUserId == cashierUserId ||
                employeeIds.Contains(n.OutletEmployeeId)))
            .ToListAsync(cancellationToken);

        foreach (var row in rows)
        {
            row.IsRead = true;
            row.ReadAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<Guid>> GetCashierEmployeeIdsAsync(Guid cashierUserId, CancellationToken cancellationToken)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == cashierUserId, cancellationToken);
        var email = user?.Email?.Trim();
        return await _context.OutletEmployees
            .AsNoTracking()
            .Where(e =>
                e.UserId == cashierUserId ||
                (email != null && e.Email.ToLower() == email.ToLower()))
            .Select(e => e.Id)
            .ToListAsync(cancellationToken);
    }

    private async Task<SaleRecordsSettings> EnsureSettingsRowAsync(CancellationToken cancellationToken)
    {
        var row = await _context.SaleRecordsSettings.FirstOrDefaultAsync(s => s.Id == SettingsRowId, cancellationToken);
        if (row != null) return row;

        row = new SaleRecordsSettings
        {
            Id = SettingsRowId,
            WeekStartDay = (int)DayOfWeek.Wednesday,
            WeeksToShow = 2,
            UpdatedAt = DateTime.UtcNow,
        };
        _context.SaleRecordsSettings.Add(row);
        await _context.SaveChangesAsync(cancellationToken);
        return row;
    }

    private static SaleRecordsSettingsDto ToDto(SaleRecordsSettings row) => new()
    {
        WeekStartDay = row.WeekStartDay,
        WeekStartDayName = DayName(row.WeekStartDay),
        WeeksToShow = row.WeeksToShow,
    };

    private sealed record Snapshot(
        Guid OutletEmployeeId,
        Guid? CashierUserId,
        string OutletName,
        decimal ShowroomSale,
        decimal SystemSale);

    private async Task<Snapshot> BuildSnapshotAsync(DateTime pd, Guid outletId, CancellationToken cancellationToken)
    {
        var outlet = await _context.Outlets.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == outletId && o.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Showroom was not found or is inactive.");

        var dayEnd = await _context.DayEndOutletLines
            .AsNoTracking()
            .Include(l => l.OutletEmployee)
            .Where(l => l.OutletId == outletId && l.ProcessDate >= pd && l.ProcessDate < pd.AddDays(1))
            .FirstOrDefaultAsync(cancellationToken);

        var cash = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Include(l => l.OutletEmployee)
            .Where(l => l.OutletId == outletId && l.ProcessDate >= pd && l.ProcessDate < pd.AddDays(1))
            .FirstOrDefaultAsync(cancellationToken);

        var employee = dayEnd?.OutletEmployee ?? cash?.OutletEmployee;
        var employeeId = dayEnd?.OutletEmployeeId ?? cash?.OutletEmployeeId;
        if (employee == null && employeeId != null && employeeId != Guid.Empty)
        {
            employee = await _context.OutletEmployees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);
        }
        if (employeeId == null || employeeId == Guid.Empty)
        {
            throw new InvalidOperationException($"No cashier is assigned for {outlet.Name} on this date.");
        }

        decimal showroomSale;
        decimal systemSale;
        if (dayEnd != null)
        {
            showroomSale = dayEnd.CashierBalance;
            systemSale = dayEnd.SystemBalance;
        }
        else
        {
            showroomSale = cash?.CashierBalance
                ?? ((cash?.BalanceCash ?? 0) + (cash?.BalanceCard ?? 0) + (cash?.BalanceUber ?? 0) + (cash?.BalancePickme ?? 0));
            var dayStart = pd;
            var dayEndExclusive = pd.AddDays(1);
            systemSale = await _context.Deliveries
                .AsNoTracking()
                .Where(d =>
                    d.IsActive &&
                    d.OutletId == outletId &&
                    d.DeliveryDate >= dayStart &&
                    d.DeliveryDate < dayEndExclusive &&
                    d.Status == DeliveryStatus.Approved)
                .SumAsync(d => d.TotalValue, cancellationToken);
        }

        Guid? cashierUserId = employee?.UserId;
        if (cashierUserId == null && employee != null && !string.IsNullOrWhiteSpace(employee.Email))
        {
            var email = employee.Email.Trim();
            cashierUserId = await _context.Users.AsNoTracking()
                .Where(u => u.Email == email)
                .Select(u => (Guid?)u.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new Snapshot(employeeId.Value, cashierUserId, outlet.Name, showroomSale, systemSale);
    }
}
