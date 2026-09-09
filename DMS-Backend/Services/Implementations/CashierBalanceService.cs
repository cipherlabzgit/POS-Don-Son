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
    public const string ResetStatus = "Reset";
    public const string LockedResubmitMessage =
        "This showroom's cashier balance is already submitted and locked. It can be entered again only after it is rejected in Approvals, or after an approved date is reset in Day-End Process.";

    public static bool IsCashierBalanceApprovalType(string? approvalType) =>
        string.Equals(approvalType, LineApprovalType, StringComparison.OrdinalIgnoreCase)
        || string.Equals(approvalType, ShowroomClosedApprovalType, StringComparison.OrdinalIgnoreCase);

    private readonly ApplicationDbContext _context;
    private readonly ILogger<CashierBalanceService> _logger;

    public CashierBalanceService(ApplicationDbContext context, ILogger<CashierBalanceService> logger)
    {
        _context = context;
        _logger = logger;
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
        try
        {
            await BackfillMissingCashiersAsync(pd, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cashier balance backfill skipped for {ProcessDate}", pd);
        }

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

        var lineRows = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Include(l => l.OutletEmployee)
                .ThenInclude(e => e!.User)
            .Where(l => l.ProcessDate == pd)
            .ToListAsync(cancellationToken);
        var lines = lineRows
            .GroupBy(l => l.OutletId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(l => l.UpdatedAt).First());

        var latestByLine = await GetLatestApprovalsByLineIdsAsync(
            lines.Values.Select(l => l.Id).ToList(),
            cancellationToken);

        var rows = outlets.Select(outlet =>
        {
            lines.TryGetValue(outlet.Id, out var line);
            latestByLine.TryGetValue(line?.Id ?? Guid.Empty, out var latest);
            var (status, locked) = ResolveLineLock(line, latest, dayRow?.IsApproved == true);
            return new CashierBalanceOutletRowDto
            {
                OutletId = outlet.Id,
                Code = outlet.Code,
                Name = outlet.Name,
                IsShowroomClosed = line?.IsShowroomClosed ?? false,
                OutletEmployeeId = line?.OutletEmployeeId,
                CashierName = PreferPersonName(
                    line?.CashierName,
                    CashierDisplayName(line?.OutletEmployee),
                    UserDisplayName(latest?.RequestedBy)),
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
        var employees = await _context.OutletEmployees
            .AsNoTracking()
            .Include(e => e.User)
            .Where(e => e.OutletId == outletId && e.IsActive)
            .ToListAsync(cancellationToken);

        return employees
            .GroupBy(e => e.UserId ?? e.Id)
            .Select(g => g
                .OrderBy(e => IsGenericCashierLabel(CashierDisplayName(e)) ? 1 : 0)
                .ThenByDescending(e => e.UpdatedAt)
                .First())
            .Select(e => new DayEndCashierOptionDto
            {
                OutletEmployeeId = e.Id,
                DisplayName = PreferPersonName(
                    CashierDisplayName(e),
                    e.Email,
                    e.EmployeeCode) ?? "Cashier",
            })
            .GroupBy(e => e.DisplayName.Trim().ToLowerInvariant())
            .Select(g => g.First())
            .OrderBy(e => e.DisplayName)
            .ToList();
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

        var submitter = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == submittedByUserId, cancellationToken);

        foreach (var line in dto.Lines)
        {
            lineByOutlet.TryGetValue(line.OutletId, out var existingLine);
            latestByLine.TryGetValue(existingLine?.Id ?? Guid.Empty, out var latest);
            var (_, locked) = ResolveLineLock(existingLine, latest, existingDay?.IsApproved == true);
            if (locked)
            {
                throw new InvalidOperationException(LockedResubmitMessage);
            }
        }

        var writable = dto.Lines;

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

            if (string.IsNullOrWhiteSpace(line.CashierName))
            {
                line.CashierName = UserDisplayName(submitter);
            }

            var declared = GetDeclaredLineTotal(line);
            if (declared <= 0)
            {
                throw new InvalidOperationException("Cashier balance (cash, card, Uber, PickMe) must be greater than zero for open showrooms.");
            }

            if (line.OutletEmployeeId is { } empId && empId != Guid.Empty)
            {
                var employee = _context.OutletEmployees.Local.FirstOrDefault(e => e.Id == empId && e.OutletId == line.OutletId)
                    ?? await _context.OutletEmployees
                        .Include(e => e.User)
                        .FirstOrDefaultAsync(
                            e => e.Id == empId && e.OutletId == line.OutletId && e.IsActive,
                            cancellationToken);
                if (employee == null)
                {
                    throw new InvalidOperationException("One or more selected cashiers are invalid for their showroom.");
                }

                line.CashierName = PreferPersonName(
                    line.CashierName,
                    UserDisplayName(submitter),
                    CashierDisplayName(employee));
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
                        CashierName = null,
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
                    existingLine.CashierName = null;
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
                    CashierName = PreferPersonName(line.CashierName, UserDisplayName(submitter)),
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
                existingLine.CashierName = PreferPersonName(line.CashierName, UserDisplayName(submitter));
                existingLine.UpdatedAt = now;
                ApplyChannelAmounts(existingLine, line, total);
            }

            EnqueueLineApproval(lineId, submittedByUserId, pd, outlet, line);
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
            .Include(a => a.RequestedBy)
            .Where(a => lineIds.Contains(a.EntityId)
                        && (a.ApprovalType == LineApprovalType || a.ApprovalType == ShowroomClosedApprovalType))
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(a => a.EntityId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(a => a.RequestedAt).ThenByDescending(a => a.CreatedAt).First());
    }

    private static bool LineHasBeenEntered(CashierBalanceOutletLine line) =>
        line.IsShowroomClosed
        || line.CashierBalance.HasValue
        || line.BalanceCash.HasValue
        || line.BalanceCard.HasValue
        || line.BalanceUber.HasValue
        || line.BalancePickme.HasValue;

    private static bool IsUnlockStatus(string? status) =>
        string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, ResetStatus, StringComparison.OrdinalIgnoreCase);

    private static (string? Status, bool Locked) ResolveLineLock(
        CashierBalanceOutletLine? line,
        ApprovalQueue? latest,
        bool dayApproved)
    {
        if (line == null)
        {
            return (null, false);
        }

        var entered = LineHasBeenEntered(line);
        var status = latest?.Status;

        if (IsUnlockStatus(status))
        {
            return (status, false);
        }

        if (latest != null)
        {
            return (status, true);
        }

        if (entered || dayApproved)
        {
            return (dayApproved ? "Approved" : "Submitted", true);
        }

        return (null, false);
    }

    public async Task ResetApprovedForDateAsync(DateTime processDate, Guid resetByUserId, CancellationToken cancellationToken = default)
    {
        var pd = NormalizeProcessDate(processDate);
        var day = await _context.CashierBalanceDays.FirstOrDefaultAsync(c => c.ProcessDate == pd, cancellationToken);
        if (day is not { IsApproved: true })
        {
            throw new InvalidOperationException("Only an approved cashier balance date can be reset from Day-End Process.");
        }

        var now = DateTime.UtcNow;
        day.IsApproved = false;
        day.IsSubmitted = false;
        day.ApprovedById = null;
        day.ApprovedAt = null;
        day.SubmittedAt = null;
        day.SubmittedById = null;
        day.UpdatedAt = now;

        var lines = await _context.CashierBalanceOutletLines
            .Where(l => l.ProcessDate == pd)
            .Select(l => l.Id)
            .ToListAsync(cancellationToken);

        if (lines.Count > 0)
        {
            var approvals = await _context.ApprovalQueues
                .Where(a => lines.Contains(a.EntityId) && IsCashierBalanceApprovalType(a.ApprovalType))
                .ToListAsync(cancellationToken);

            foreach (var group in approvals.GroupBy(a => a.EntityId))
            {
                var latest = group.OrderByDescending(a => a.RequestedAt).ThenByDescending(a => a.CreatedAt).First();
                if (string.Equals(latest.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                {
                    latest.Status = ResetStatus;
                    latest.Notes = string.IsNullOrWhiteSpace(latest.Notes)
                        ? "Reset from Day-End Process."
                        : latest.Notes + " Reset from Day-End Process.";
                    latest.UpdatedById = resetByUserId;
                    latest.UpdatedAt = now;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static readonly JsonSerializerOptions ApprovalPayloadJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private void EnqueueLineApproval(
        Guid lineId,
        Guid requestedByUserId,
        DateTime processDate,
        Outlet outlet,
        SubmitCashierBalanceLineDto line)
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

        var isClosed = line.IsShowroomClosed;
        var cash = isClosed ? (decimal?)null : (line.BalanceCash ?? 0m);
        var card = isClosed ? (decimal?)null : (line.BalanceCard ?? 0m);
        var uber = isClosed ? (decimal?)null : (line.BalanceUber ?? 0m);
        var pickme = isClosed ? (decimal?)null : (line.BalancePickme ?? 0m);
        var total = isClosed ? (decimal?)null : GetDeclaredLineTotal(line);

        var payload = JsonSerializer.Serialize(new
        {
            processDate = processDate.ToString("yyyy-MM-dd"),
            outletId = outlet.Id,
            outletCode = outlet.Code,
            outletName = outlet.Name,
            isShowroomClosed = isClosed,
            cashierName = line.CashierName,
            balanceCash = cash,
            balanceCard = card,
            balanceUber = uber,
            balancePickme = pickme,
            total,
        }, ApprovalPayloadJson);

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
                : $"Cash {cash:0.00} | Card {card:0.00} | Uber {uber:0.00} | PickMe {pickme:0.00} | Total {total:0.00}.",
            IsActive = true,
            CreatedById = requestedByUserId,
            UpdatedById = requestedByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var v in values)
        {
            if (!string.IsNullOrWhiteSpace(v))
                return v.Trim();
        }

        return null;
    }

    private static bool IsGenericCashierLabel(string? name)
    {
        var n = (name ?? string.Empty).Trim();
        if (n.Length == 0) return true;
        n = n.ToLowerInvariant();
        return n is "pos user" or "pos" or "cashier" or "cashier pos" or "user";
    }

    /// <summary>Skip placeholder labels like "POS User" so the signed-in cashier name is shown.</summary>
    private static string? PreferPersonName(params string?[] values)
    {
        string? fallback = null;
        foreach (var v in values)
        {
            if (string.IsNullOrWhiteSpace(v)) continue;
            var t = v.Trim();
            if (!IsGenericCashierLabel(t)) return t;
            fallback ??= t;
        }

        return fallback;
    }

    private static string? UserDisplayName(User? user)
    {
        if (user == null) return null;
        var name = $"{user.FirstName} {user.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(name))
            name = user.Email;
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    private static string? CashierDisplayName(OutletEmployee? employee)
    {
        if (employee == null) return null;
        return PreferPersonName(
            UserDisplayName(employee.User),
            employee.FullName,
            $"{employee.FirstName} {employee.LastName}".Trim(),
            employee.Email);
    }

    private static void ApplyUserIdentity(OutletEmployee employee, User user)
    {
        var first = string.IsNullOrWhiteSpace(user.FirstName) ? "Cashier" : user.FirstName.Trim();
        var last = string.IsNullOrWhiteSpace(user.LastName) ? "POS" : user.LastName.Trim();
        employee.FirstName = first;
        employee.LastName = last;
        employee.FullName = FirstNonEmpty(user.FullName, $"{first} {last}", user.Email);
        employee.IsActive = true;
        employee.UpdatedAt = DateTime.UtcNow;
        employee.UpdatedById = user.Id;
        if (string.IsNullOrWhiteSpace(employee.Email) && !string.IsNullOrWhiteSpace(user.Email))
            employee.Email = user.Email.Trim();
    }

    private async Task BackfillMissingCashiersAsync(DateTime processDate, CancellationToken cancellationToken)
    {
        var lines = await _context.CashierBalanceOutletLines
            .Include(l => l.OutletEmployee)
                .ThenInclude(e => e!.User)
            .Where(l => l.ProcessDate == processDate && !l.IsShowroomClosed)
            .ToListAsync(cancellationToken);
        if (lines.Count == 0) return;

        var latest = await GetLatestApprovalsByLineIdsAsync(lines.Select(l => l.Id).ToList(), cancellationToken);
        var changed = false;
        foreach (var line in lines)
        {
            if (line.OutletEmployeeId is null || line.OutletEmployeeId == Guid.Empty)
            {
                if (!latest.TryGetValue(line.Id, out var approval) || approval.RequestedById == Guid.Empty)
                    continue;

                var employeeId = await EnsureOutletEmployeeForUserAsync(line.OutletId, approval.RequestedById, cancellationToken);
                if (employeeId is null) continue;
                line.OutletEmployeeId = employeeId;
                line.CashierName = PreferPersonName(line.CashierName, UserDisplayName(approval.RequestedBy));
                line.UpdatedAt = DateTime.UtcNow;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(line.CashierName) || IsGenericCashierLabel(line.CashierName))
            {
                latest.TryGetValue(line.Id, out var approval);
                var name = PreferPersonName(
                    line.CashierName,
                    CashierDisplayName(line.OutletEmployee),
                    UserDisplayName(approval?.RequestedBy));
                if (!string.IsNullOrWhiteSpace(name))
                {
                    line.CashierName = name;
                    line.UpdatedAt = DateTime.UtcNow;
                    changed = true;
                }
            }
        }

        if (changed)
            await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Guid?> EnsureOutletEmployeeForUserAsync(
        Guid outletId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return null;

        var linked = await _context.OutletEmployees
            .FirstOrDefaultAsync(e => e.OutletId == outletId && e.UserId == userId, cancellationToken);
        if (linked != null)
        {
            ApplyUserIdentity(linked, user);
            return linked.Id;
        }

        var email = (user.Email ?? string.Empty).Trim();
        if (email.Length > 100)
            email = email[..100];
        if (!string.IsNullOrEmpty(email))
        {
            var emailLower = email.ToLower();
            var byEmail = await _context.OutletEmployees
                .FirstOrDefaultAsync(
                    e => e.OutletId == outletId
                         && e.Email != null
                         && e.Email.ToLower() == emailLower,
                    cancellationToken);
            if (byEmail != null)
            {
                byEmail.UserId = userId;
                ApplyUserIdentity(byEmail, user);
                return byEmail.Id;
            }
        }

        var now = DateTime.UtcNow;
        var code = $"POS-{outletId:N}-{userId:N}";
        if (code.Length > 100)
            code = code[..100];

        var phone = user.Phone?.Trim();
        if (phone is { Length: > 20 })
            phone = phone[..20];

        var employee = new OutletEmployee
        {
            Id = Guid.NewGuid(),
            OutletId = outletId,
            UserId = userId,
            EmployeeCode = code,
            Email = string.IsNullOrEmpty(email) ? $"{userId:N}@pos.local" : email,
            Phone = phone,
            Position = "Cashier",
            CreatedAt = now,
            CreatedById = userId,
        };
        ApplyUserIdentity(employee, user);
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
