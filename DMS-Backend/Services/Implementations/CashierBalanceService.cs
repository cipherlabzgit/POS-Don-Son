using System.Text.Json;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.CashierBalance;
using DMS_Backend.Models.DTOs.DayEnd;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class CashierBalanceService : ICashierBalanceService
{
    public const string LineApprovalType = "Cashier Balance";
    public const string ShowroomClosedApprovalType = "CashierBalanceShowroomClosed";

    public static bool IsCashierBalanceApprovalType(string? approvalType) =>
        string.Equals(approvalType, LineApprovalType, StringComparison.OrdinalIgnoreCase)
        || string.Equals(approvalType, ShowroomClosedApprovalType, StringComparison.OrdinalIgnoreCase);

    private readonly ApplicationDbContext _context;

    public CashierBalanceService(ApplicationDbContext context)
    {
        _context = context;
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
        await BackfillMissingCashiersAsync(pd, cancellationToken);

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
            .Include(l => l.OutletEmployee)
            .Where(l => l.ProcessDate == pd)
            .ToDictionaryAsync(l => l.OutletId, cancellationToken);

        var latestByLine = await GetLatestApprovalsByLineIdsAsync(
            lines.Values.Select(l => l.Id).ToList(),
            cancellationToken);

        var rows = outlets.Select(outlet =>
        {
            lines.TryGetValue(outlet.Id, out var line);
            latestByLine.TryGetValue(line?.Id ?? Guid.Empty, out var latest);
            var (status, locked) = ResolveLineLock(line, latest);
            return new CashierBalanceOutletRowDto
            {
                OutletId = outlet.Id,
                Code = outlet.Code,
                Name = outlet.Name,
                IsShowroomClosed = line?.IsShowroomClosed ?? false,
                OutletEmployeeId = line?.OutletEmployeeId,
                CashierName = CashierDisplayName(line?.OutletEmployee),
                CashierBalance = line?.CashierBalance,
                BalanceCash = line?.BalanceCash,
                BalanceCard = line?.BalanceCard,
                BalanceUber = line?.BalanceUber,
                BalancePickme = line?.BalancePickme,
                LineStatus = status,
                IsLocked = locked,
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

        var outletDict = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .ToDictionaryAsync(o => o.Id, cancellationToken);

        if (outletDict.Count == 0)
        {
            throw new InvalidOperationException("No active showrooms are configured.");
        }

        if (dto.Lines.Any(l => !outletDict.ContainsKey(l.OutletId)))
        {
            throw new InvalidOperationException("One or more showrooms are invalid or inactive.");
        }

        if (dto.Lines.Select(l => l.OutletId).Distinct().Count() != dto.Lines.Count)
        {
            throw new InvalidOperationException("Each showroom can appear only once.");
        }

        var existingLines = await _context.CashierBalanceOutletLines
            .Where(l => l.ProcessDate == pd)
            .ToListAsync(cancellationToken);
        var lineByOutlet = existingLines.ToDictionary(l => l.OutletId);
        var latestByLine = await GetLatestApprovalsByLineIdsAsync(
            existingLines.Select(l => l.Id).ToList(),
            cancellationToken);

        var writable = new List<SubmitCashierBalanceLineDto>();
        foreach (var line in dto.Lines)
        {
            lineByOutlet.TryGetValue(line.OutletId, out var existingLine);
            latestByLine.TryGetValue(existingLine?.Id ?? Guid.Empty, out var latest);
            var (_, locked) = ResolveLineLock(existingLine, latest);
            if (locked)
            {
                continue;
            }

            writable.Add(line);
        }

        if (writable.Count == 0)
        {
            return;
        }

        var isFullSubmit = dto.Lines.Count == outletDict.Count
            && outletDict.Keys.All(id => dto.Lines.Any(l => l.OutletId == id));

        foreach (var line in writable)
        {
            if (line.IsShowroomClosed)
            {
                continue;
            }

            if (line.OutletEmployeeId is null || line.OutletEmployeeId == Guid.Empty)
            {
                line.OutletEmployeeId = await EnsureOutletEmployeeForUserAsync(
                    line.OutletId,
                    submittedByUserId,
                    cancellationToken);
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

            if (line.OutletEmployeeId is { } empId && empId != Guid.Empty)
            {
                var employeeOk =
                    _context.OutletEmployees.Local.Any(e => e.Id == empId && e.OutletId == line.OutletId)
                    || await _context.OutletEmployees.AnyAsync(
                        e => e.Id == empId && e.OutletId == line.OutletId && e.IsActive,
                        cancellationToken);
                if (!employeeOk)
                {
                    throw new InvalidOperationException("One or more selected cashiers are invalid for their showroom.");
                }
            }
        }

        var now = DateTime.UtcNow;

        if (existingDay == null)
        {
            existingDay = new CashierBalanceDay
            {
                Id = Guid.NewGuid(),
                ProcessDate = pd,
                IsSubmitted = isFullSubmit,
                SubmittedAt = isFullSubmit ? now : null,
                SubmittedById = isFullSubmit ? submittedByUserId : null,
                IsApproved = false,
                ApprovedById = null,
                ApprovedAt = null,
                CreatedAt = now,
                UpdatedAt = now,
            };
            _context.CashierBalanceDays.Add(existingDay);
        }
        else if (isFullSubmit)
        {
            existingDay.IsSubmitted = true;
            existingDay.SubmittedAt = now;
            existingDay.SubmittedById = submittedByUserId;
            existingDay.IsApproved = false;
            existingDay.ApprovedById = null;
            existingDay.ApprovedAt = null;
            existingDay.UpdatedAt = now;
        }
        else
        {
            existingDay.UpdatedAt = now;
        }

        foreach (var line in writable)
        {
            var outlet = outletDict[line.OutletId];
            lineByOutlet.TryGetValue(line.OutletId, out var existingLine);
            Guid lineId;

            if (line.IsShowroomClosed)
            {
                if (existingLine == null)
                {
                    lineId = Guid.NewGuid();
                    existingLine = new CashierBalanceOutletLine
                    {
                        Id = lineId,
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
                    };
                    _context.CashierBalanceOutletLines.Add(existingLine);
                    lineByOutlet[line.OutletId] = existingLine;
                }
                else
                {
                    lineId = existingLine.Id;
                    existingLine.IsShowroomClosed = true;
                    existingLine.OutletEmployeeId = null;
                    existingLine.CashierBalance = null;
                    existingLine.BalanceCash = null;
                    existingLine.BalanceCard = null;
                    existingLine.BalanceUber = null;
                    existingLine.BalancePickme = null;
                    existingLine.UpdatedAt = now;
                }
            }
            else if (existingLine == null)
            {
                var total = GetDeclaredLineTotal(line);
                lineId = Guid.NewGuid();
                existingLine = new CashierBalanceOutletLine
                {
                    Id = lineId,
                    ProcessDate = pd,
                    OutletId = line.OutletId,
                    IsShowroomClosed = false,
                    OutletEmployeeId = line.OutletEmployeeId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                ApplyChannelAmounts(existingLine, line, total);
                _context.CashierBalanceOutletLines.Add(existingLine);
                lineByOutlet[line.OutletId] = existingLine;
            }
            else
            {
                lineId = existingLine.Id;
                var total = GetDeclaredLineTotal(line);
                existingLine.IsShowroomClosed = false;
                existingLine.OutletEmployeeId = line.OutletEmployeeId;
                existingLine.UpdatedAt = now;
                ApplyChannelAmounts(existingLine, line, total);
            }

            EnqueueLineApproval(
                lineId,
                submittedByUserId,
                pd,
                outlet,
                line.IsShowroomClosed,
                line.IsShowroomClosed ? null : GetDeclaredLineTotal(line));
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<Guid, ApprovalQueue>> GetLatestApprovalsByLineIdsAsync(
        List<Guid> lineIds,
        CancellationToken cancellationToken)
    {
        if (lineIds.Count == 0)
        {
            return new Dictionary<Guid, ApprovalQueue>();
        }

        var rows = await _context.ApprovalQueues
            .AsNoTracking()
            .Where(a => a.IsActive && lineIds.Contains(a.EntityId)
                        && (a.ApprovalType == LineApprovalType || a.ApprovalType == ShowroomClosedApprovalType))
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(a => a.EntityId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(a => a.RequestedAt).ThenByDescending(a => a.CreatedAt).First());
    }

    private static (string? Status, bool Locked) ResolveLineLock(
        CashierBalanceOutletLine? line,
        ApprovalQueue? latest)
    {
        if (line == null)
        {
            return (null, false);
        }

        if (latest != null)
        {
            var pendingOrApproved =
                string.Equals(latest.Status, "Pending", StringComparison.OrdinalIgnoreCase)
                || string.Equals(latest.Status, "Approved", StringComparison.OrdinalIgnoreCase);
            return (latest.Status, pendingOrApproved);
        }

        return (null, false);
    }

    private void EnqueueLineApproval(
        Guid lineId,
        Guid requestedByUserId,
        DateTime processDate,
        Outlet outlet,
        bool isClosed,
        decimal? total)
    {
        var alreadyPending = _context.ApprovalQueues.Local
                .Any(a => a.EntityId == lineId && a.Status == "Pending" && IsCashierBalanceApprovalType(a.ApprovalType))
            || _context.ApprovalQueues.Any(a =>
                a.EntityId == lineId
                && a.IsActive
                && a.Status == "Pending"
                && (a.ApprovalType == LineApprovalType || a.ApprovalType == ShowroomClosedApprovalType));
        if (alreadyPending)
        {
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            processDate = processDate.ToString("yyyy-MM-dd"),
            outletId = outlet.Id,
            outletCode = outlet.Code,
            outletName = outlet.Name,
            isShowroomClosed = isClosed,
            total,
        });

        _context.ApprovalQueues.Add(new ApprovalQueue
        {
            Id = Guid.NewGuid(),
            ApprovalType = LineApprovalType,
            EntityId = lineId,
            EntityReference = $"{outlet.Code} - {processDate:yyyy-MM-dd}",
            RequestedById = requestedByUserId,
            RequestedAt = DateTime.UtcNow,
            Status = "Pending",
            RequestData = payload,
            Priority = 0,
            Notes = isClosed
                ? "Showroom closed for cashier balance date."
                : $"Cash submission total {total:0.00}.",
            IsActive = true,
            CreatedById = requestedByUserId,
            UpdatedById = requestedByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
    }

    private static string? CashierDisplayName(OutletEmployee? employee)
    {
        if (employee == null) return null;
        var name = employee.FullName;
        if (string.IsNullOrWhiteSpace(name))
            name = $"{employee.FirstName} {employee.LastName}".Trim();
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    private async Task BackfillMissingCashiersAsync(DateTime processDate, CancellationToken cancellationToken)
    {
        var missing = await _context.CashierBalanceOutletLines
            .Where(l => l.ProcessDate == processDate && l.OutletEmployeeId == null && !l.IsShowroomClosed)
            .ToListAsync(cancellationToken);
        if (missing.Count == 0) return;

        var latest = await GetLatestApprovalsByLineIdsAsync(missing.Select(l => l.Id).ToList(), cancellationToken);
        var changed = false;
        foreach (var line in missing)
        {
            if (!latest.TryGetValue(line.Id, out var approval) || approval.RequestedById == Guid.Empty)
                continue;

            var employeeId = await EnsureOutletEmployeeForUserAsync(line.OutletId, approval.RequestedById, cancellationToken);
            if (employeeId is null) continue;
            line.OutletEmployeeId = employeeId;
            line.UpdatedAt = DateTime.UtcNow;
            changed = true;
        }

        if (changed)
            await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Guid?> EnsureOutletEmployeeForUserAsync(
        Guid outletId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var linked = await _context.OutletEmployees
            .FirstOrDefaultAsync(e => e.OutletId == outletId && e.UserId == userId, cancellationToken);
        if (linked != null)
        {
            if (!linked.IsActive)
            {
                linked.IsActive = true;
                linked.UpdatedAt = DateTime.UtcNow;
            }
            return linked.Id;
        }

        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return null;

        var email = (user.Email ?? string.Empty).Trim();
        if (!string.IsNullOrEmpty(email))
        {
            var byEmail = await _context.OutletEmployees
                .FirstOrDefaultAsync(
                    e => e.OutletId == outletId && e.Email.ToLower() == email.ToLower(),
                    cancellationToken);
            if (byEmail != null)
            {
                byEmail.UserId = userId;
                byEmail.IsActive = true;
                if (string.IsNullOrWhiteSpace(byEmail.FullName))
                    byEmail.FullName = user.FullName;
                byEmail.UpdatedAt = DateTime.UtcNow;
                return byEmail.Id;
            }
        }

        var now = DateTime.UtcNow;
        var employee = new OutletEmployee
        {
            Id = Guid.NewGuid(),
            OutletId = outletId,
            UserId = userId,
            EmployeeCode = $"POS-{userId:N}"[..Math.Min(100, $"POS-{userId:N}".Length)],
            FirstName = string.IsNullOrWhiteSpace(user.FirstName) ? "Cashier" : user.FirstName.Trim(),
            LastName = user.LastName?.Trim() ?? string.Empty,
            FullName = string.IsNullOrWhiteSpace(user.FullName) ? user.Email : user.FullName,
            Email = string.IsNullOrEmpty(email) ? $"{userId:N}@pos.local" : email,
            Phone = user.Phone,
            Position = "Cashier",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedById = userId,
            UpdatedById = userId,
        };
        _context.OutletEmployees.Add(employee);
        return employee.Id;
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
