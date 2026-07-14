using Microsoft.EntityFrameworkCore;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.AdministratorDeliveryPlan;
using DMS_Backend.Models.DTOs.DeliveryPlans;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

/// <summary>
/// Administrator Delivery Plan: plan dates limited to the next 3 Sri Lanka calendar days (tomorrow through day+3),
/// seed items from default_quantities, submit plan, and upsert draft <see cref="Delivery"/> rows per outlet.
/// Only the 5:00 AM preload delivery turn is permitted.
/// </summary>
public sealed class AdministratorDeliveryPlanService : IAdministratorDeliveryPlanService
{
    private readonly ApplicationDbContext _context;
    private readonly IDeliveryPlanService _deliveryPlans;
    private readonly ILogger<AdministratorDeliveryPlanService> _logger;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public AdministratorDeliveryPlanService(
        ApplicationDbContext context,
        IDeliveryPlanService deliveryPlans,
        ILogger<AdministratorDeliveryPlanService> logger,
        IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _deliveryPlans = deliveryPlans;
        _logger = logger;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<IReadOnlyList<AdministratorDeliveryScheduleDto>> GetSchedulesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<DayType>()
            .AsNoTracking()
            .Where(d => d.IsActive)
            .OrderBy(d => d.SortOrder)
            .ThenBy(d => d.Name)
            .Select(d => new AdministratorDeliveryScheduleDto
            {
                DayTypeId = d.Id,
                DisplayName = d.Name,
                Code = d.Code,
                SortOrder = d.SortOrder,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AdministratorDeliveryPlanWindowDto> GetPlanningWindowAsync(
        CancellationToken cancellationToken = default)
    {
        var w = await _deliveryPlans.GetPlanningWindowAsync(cancellationToken);
        return new AdministratorDeliveryPlanWindowDto
        {
            AllowedPlanDates = w.AllowedPlanDates,
            MinPlanDate = w.MinPlanDate,
            MaxPlanDate = w.MaxPlanDate,
            AvailableDeliveryTurns = w.AvailableDeliveryTurns,
        };
    }

    public async Task<IReadOnlyList<DeliveryPlanListDto>> GetPlansInWindowAsync(
        CancellationToken cancellationToken = default)
    {
        var today = DeliveryPlanPreloadRules.TodaySriLanka();
        var from = DeliveryPlanPreloadRules.SlDateToUtcMidnight(today.AddDays(1));
        var to = DeliveryPlanPreloadRules.SlDateToUtcMidnight(today.AddDays(4));

        var (plans, _) = await _deliveryPlans.GetAllAsync(1, 200, from, to, null, null, cancellationToken);
        return plans.ToList();
    }

    public async Task<DeliveryPlanDetailDto> QuickCreateAndSyncAsync(
        AdministratorQuickCreateDeliveryPlanDto dto,
        Guid userId,
        List<string> permissionCodes,
        CancellationToken cancellationToken = default)
    {
        if (!DateOnly.TryParse(dto.PlanDate, out var planDateOnly))
        {
            throw new InvalidOperationException("PlanDate must be a valid yyyy-MM-dd value.");
        }

        var dayType = await _context.Set<DayType>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dto.DayTypeId && d.IsActive, cancellationToken);

        if (dayType == null)
        {
            throw new InvalidOperationException("Day type not found or inactive.");
        }

        if (dto.DeliveryTurnId == Guid.Empty)
        {
            throw new InvalidOperationException("A delivery turn must be selected.");
        }

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("dms:delivery-plan", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("delivery_plan:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var planDateUtc = DeliveryPlanPreloadRules.SlDateToUtcMidnight(planDateOnly);

        var planNo = await GenerateUniquePlanNoAsync(planDateOnly, cancellationToken);

        var createDto = new CreateDeliveryPlanDto
        {
            PlanNo = planNo,
            PlanDate = planDateUtc,
            DeliveryTurnId = dto.DeliveryTurnId,
            DayTypeId = dto.DayTypeId,
            UseFreezerStock = dto.UseFreezerStock,
            ExcludedOutlets = null,
            ExcludedProducts = null,
            Notes = dto.Notes,
        };

        var created = await _deliveryPlans.CreateAsync(createDto, userId, cancellationToken);

        var defaults = await _context.Set<DefaultQuantity>()
            .AsNoTracking()
            .Include(dq => dq.Outlet)
            .Where(dq =>
                dq.IsActive
                && dq.DayTypeId == dto.DayTypeId
                && dq.Outlet != null
                && dq.Outlet.IsActive
                && dq.Outlet.IsDeliveryPoint)
            .ToListAsync(cancellationToken);

        var bulk = defaults
            .Where(dq => dq.FullQuantity > 0 || dq.MiniQuantity > 0)
            .Select(dq => new BulkUpsertDeliveryPlanItemDto
            {
                ProductId = dq.ProductId,
                OutletId = dq.OutletId,
                FullQuantity = dq.FullQuantity,
                MiniQuantity = dq.MiniQuantity,
                Notes = null,
            })
            .ToList();

        if (bulk.Count > 0)
        {
            await _deliveryPlans.BulkUpsertItemsAsync(created.Id, bulk, userId, cancellationToken);
        }

        var submitted = await _deliveryPlans.SubmitAsync(created.Id, userId, cancellationToken);

        await SyncDeliveriesFromPlanAsync(submitted.Id, planDateUtc, userId, shouldAutoApprove, cancellationToken);

        var detail = await _deliveryPlans.GetByIdAsync(submitted.Id, cancellationToken);
        return detail ?? submitted;
    }

    private async Task<string> GenerateUniquePlanNoAsync(DateOnly planDate, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var suffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            var candidate = $"DP-ADM-{planDate:yyyyMMdd}-{suffix}";
            if (candidate.Length > 50)
            {
                candidate = candidate[..50];
            }

            var exists = await _context.Set<DeliveryPlan>()
                .AnyAsync(p => p.PlanNo == candidate, cancellationToken);

            if (!exists)
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Could not generate a unique plan number.");
    }

    private async Task SyncDeliveriesFromPlanAsync(
        Guid deliveryPlanId,
        DateTime planDateUtc,
        Guid userId,
        bool shouldAutoApprove,
        CancellationToken cancellationToken)
    {
        var items = await _context.Set<DeliveryPlanItem>()
            .AsNoTracking()
            .Include(i => i.Product)
            .Where(i => i.DeliveryPlanId == deliveryPlanId && i.IsActive && !i.IsExcluded)
            .ToListAsync(cancellationToken);

        if (items.Count == 0)
        {
            _logger.LogInformation("No delivery plan items to sync to deliveries for plan {PlanId}", deliveryPlanId);
            return;
        }

        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Set<Product>()
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        foreach (var outletGroup in items.GroupBy(i => i.OutletId))
        {
            var outletId = outletGroup.Key;

            var aggregated = outletGroup
                .GroupBy(i => i.ProductId)
                .Select(g =>
                {
                    var qty = g.Sum(x => x.FullQuantity + x.MiniQuantity);
                    return (ProductId: g.Key, Quantity: qty);
                })
                .Where(x => x.Quantity > 0)
                .ToList();

            if (aggregated.Count == 0)
            {
                continue;
            }

            var existing = await _context.Deliveries
                .Include(d => d.Items)
                .FirstOrDefaultAsync(
                    d => d.OutletId == outletId
                        && d.DeliveryDate >= planDateUtc
                        && d.DeliveryDate < planDateUtc.AddDays(1)
                        && d.Status == DeliveryStatus.Draft
                        && d.IsActive,
                    cancellationToken);

            if (existing != null)
            {
                _context.DeliveryItems.RemoveRange(existing.Items);
                existing.Items.Clear();

                foreach (var line in aggregated)
                {
                    if (!products.TryGetValue(line.ProductId, out var product))
                    {
                        continue;
                    }

                    var unitPrice = product.UnitPrice;
                    var item = new DeliveryItem
                    {
                        Id = Guid.NewGuid(),
                        DeliveryId = existing.Id,
                        ProductId = line.ProductId,
                        Quantity = line.Quantity,
                        UnitPrice = unitPrice,
                        Total = line.Quantity * unitPrice,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    existing.Items.Add(item);
                }

                existing.TotalItems = existing.Items.Count;
                existing.TotalValue = existing.Items.Sum(i => i.Total);
                existing.Status = shouldAutoApprove ? DeliveryStatus.Approved : DeliveryStatus.Pending;
                existing.UpdatedById = userId;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.Notes = $"Synced from delivery plan {deliveryPlanId}";

                if (shouldAutoApprove)
                {
                    existing.ApprovedById = userId;
                    existing.ApprovedDate = DateTime.UtcNow;
                }
            }
            else
            {
                var delivery = new Delivery
                {
                    Id = Guid.NewGuid(),
                    DeliveryNo = string.Empty,
                    DeliveryDate = planDateUtc,
                    OutletId = outletId,
                    Status = shouldAutoApprove ? DeliveryStatus.Approved : DeliveryStatus.Pending,
                    Notes = $"Synced from delivery plan {deliveryPlanId}",
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true,
                };

                if (shouldAutoApprove)
                {
                    delivery.ApprovedById = userId;
                    delivery.ApprovedDate = DateTime.UtcNow;
                }

                foreach (var line in aggregated)
                {
                    if (!products.TryGetValue(line.ProductId, out var product))
                    {
                        continue;
                    }

                    var unitPrice = product.UnitPrice;
                    delivery.Items.Add(new DeliveryItem
                    {
                        Id = Guid.NewGuid(),
                        DeliveryId = delivery.Id,
                        ProductId = line.ProductId,
                        Quantity = line.Quantity,
                        UnitPrice = unitPrice,
                        Total = line.Quantity * unitPrice,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }

                if (delivery.Items.Count == 0)
                {
                    continue;
                }

                delivery.TotalItems = delivery.Items.Count;
                delivery.TotalValue = delivery.Items.Sum(i => i.Total);

                _context.Deliveries.Add(delivery);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Synced deliveries for administrator delivery plan {PlanId}", deliveryPlanId);
    }
}
