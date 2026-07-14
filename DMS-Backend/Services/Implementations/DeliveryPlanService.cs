using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DeliveryPlans;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class DeliveryPlanService : IDeliveryPlanService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DeliveryPlanService> _logger;
    private readonly IOperationApprovalRecorder _approvalRecorder;

    public DeliveryPlanService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<DeliveryPlanService> logger,
        IOperationApprovalRecorder approvalRecorder)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _approvalRecorder = approvalRecorder;
    }

    public async Task<(IEnumerable<DeliveryPlanListDto> plans, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<DeliveryPlan>()
            .Include(dp => dp.DeliveryTurn)
            .Include(dp => dp.DayType)
            .Include(dp => dp.DeliveryPlanItems)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(dp => dp.PlanDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(dp => dp.PlanDate <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(dp => dp.Status == status);
        }

        if (deliveryTurnId.HasValue)
        {
            query = query.Where(dp => dp.DeliveryTurnId == deliveryTurnId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var plans = await query
            .OrderByDescending(dp => dp.PlanDate)
            .ThenBy(dp => dp.PlanNo)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(dp => new DeliveryPlanListDto
            {
                Id = dp.Id,
                PlanNo = dp.PlanNo,
                PlanDate = dp.PlanDate,
                DeliveryTurnId = dp.DeliveryTurnId,
                DeliveryTurnName = dp.DeliveryTurn!.Name,
                DayTypeId = dp.DayTypeId,
                DayTypeName = dp.DayType!.Name,
                Status = dp.Status,
                UseFreezerStock = dp.UseFreezerStock,
                TotalItems = dp.DeliveryPlanItems.Count,
                UpdatedAt = dp.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return (plans, totalCount);
    }

    public async Task<DeliveryPlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Set<DeliveryPlan>()
            .Include(dp => dp.DeliveryTurn)
            .Include(dp => dp.DayType)
            .Include(dp => dp.RecipePlan)
            .Include(dp => dp.DeliveryPlanItems)
                .ThenInclude(dpi => dpi.Product)
            .Include(dp => dp.DeliveryPlanItems)
                .ThenInclude(dpi => dpi.Outlet)
            .Include(dp => dp.DeliveryPlanItems)
                .ThenInclude(dpi => dpi.WeightVariant)
            .FirstOrDefaultAsync(dp => dp.Id == id, cancellationToken);

        if (plan == null)
        {
            return null;
        }

        return new DeliveryPlanDetailDto
        {
            Id = plan.Id,
            PlanNo = plan.PlanNo,
            PlanDate = plan.PlanDate,
            DeliveryTurnId = plan.DeliveryTurnId,
            DeliveryTurnName = plan.DeliveryTurn!.Name,
            DayTypeId = plan.DayTypeId,
            DayTypeName = plan.DayType!.Name,
            Status = plan.Status,
            UseFreezerStock = plan.UseFreezerStock,
            ExcludedOutlets = plan.ExcludedOutlets,
            ExcludedProducts = plan.ExcludedProducts,
            Notes = plan.Notes,
            RecipePlanId = plan.RecipePlanId,
            RecipePlanName = plan.RecipePlan?.Name,
            Items = plan.DeliveryPlanItems.Select(dpi => new DeliveryPlanItemDto
            {
                Id = dpi.Id,
                DeliveryPlanId = dpi.DeliveryPlanId,
                ProductId = dpi.ProductId,
                ProductName = dpi.Product!.Name,
                OutletId = dpi.OutletId,
                OutletName = dpi.Outlet!.Name,
                FullQuantity = dpi.FullQuantity,
                MiniQuantity = dpi.MiniQuantity,
                IsExcluded = dpi.IsExcluded,
                Notes = dpi.Notes,
                WeightVariantId = dpi.WeightVariantId,
                WeightVariantLabel = dpi.WeightVariant?.Label,
                WeightVariantGrams = dpi.WeightVariant != null ? (decimal?)dpi.WeightVariant.WeightGrams : null,
            }).ToList(),
            IsActive = plan.IsActive,
            CreatedAt = plan.CreatedAt,
            UpdatedAt = plan.UpdatedAt,
            CreatedById = plan.CreatedById,
            UpdatedById = plan.UpdatedById
        };
    }

    public async Task<DeliveryPlanDetailDto?> GetByPlanNoAsync(string planNo, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Set<DeliveryPlan>()
            .Include(dp => dp.DeliveryTurn)
            .Include(dp => dp.DayType)
            .Include(dp => dp.DeliveryPlanItems)
                .ThenInclude(dpi => dpi.Product)
            .Include(dp => dp.DeliveryPlanItems)
                .ThenInclude(dpi => dpi.Outlet)
            .FirstOrDefaultAsync(dp => dp.PlanNo == planNo, cancellationToken);

        if (plan == null)
        {
            return null;
        }

        return await GetByIdAsync(plan.Id, cancellationToken);
    }

    public async Task<DeliveryPlanDetailDto> CreateAsync(
        CreateDeliveryPlanDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var planDateSl = DeliveryPlanPreloadRules.ResolvePlanBusinessDateSriLanka(dto.PlanDate);
        await ValidatePreloadPlanHeaderAsync(planDateSl, dto.DeliveryTurnId, dto.DayTypeId, cancellationToken)
            .ConfigureAwait(false);
        await AssertNoDuplicatePlanAsync(planDateSl, dto.DeliveryTurnId, dto.DayTypeId, excludePlanId: null, cancellationToken)
            .ConfigureAwait(false);

        var plan = _mapper.Map<DeliveryPlan>(dto);
        plan.PlanDate = DeliveryPlanPreloadRules.SlDateToUtcMidnight(planDateSl);
        plan.Id = Guid.NewGuid();
        plan.Status = "Draft";
        plan.CreatedById = userId;
        plan.UpdatedById = userId;
        plan.CreatedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        _context.Set<DeliveryPlan>().Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery plan created: {PlanNo} for {PlanDate}", plan.PlanNo, plan.PlanDate);

        return (await GetByIdAsync(plan.Id, cancellationToken))!;
    }

    public async Task<DeliveryPlanDetailDto> UpdateAsync(
        Guid id,
        UpdateDeliveryPlanDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var plan = await _context.Set<DeliveryPlan>()
            .FirstOrDefaultAsync(dp => dp.Id == id, cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException($"Delivery plan with ID '{id}' not found.");
        }

        if (plan.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending plans can be updated.");
        }

        var planDateSl = DeliveryPlanPreloadRules.ResolvePlanBusinessDateSriLanka(dto.PlanDate);
        await ValidatePreloadPlanHeaderAsync(planDateSl, dto.DeliveryTurnId, dto.DayTypeId, cancellationToken)
            .ConfigureAwait(false);
        await AssertNoDuplicatePlanAsync(planDateSl, dto.DeliveryTurnId, dto.DayTypeId, excludePlanId: id, cancellationToken)
            .ConfigureAwait(false);

        _mapper.Map(dto, plan);
        plan.PlanDate = DeliveryPlanPreloadRules.SlDateToUtcMidnight(planDateSl);
        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery plan updated: {PlanNo}", plan.PlanNo);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Set<DeliveryPlan>()
            .FirstOrDefaultAsync(dp => dp.Id == id, cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException($"Delivery plan with ID '{id}' not found.");
        }

        if (plan.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending plans can be deleted.");
        }

        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery plan soft-deleted: {PlanNo}", plan.PlanNo);
    }

    public async Task<DeliveryPlanDetailDto> SubmitAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<IEnumerable<DeliveryPlanItemDto>> BulkUpsertItemsAsync(
        Guid planId,
        List<BulkUpsertDeliveryPlanItemDto> items,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var plan = await _context.Set<DeliveryPlan>()
            .Include(dp => dp.DeliveryPlanItems)
            .FirstOrDefaultAsync(dp => dp.Id == planId, cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException($"Delivery plan with ID '{planId}' not found.");
        }

        if (plan.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending plans can have items modified.");
        }

        var results = new List<DeliveryPlanItemDto>();

        foreach (var itemDto in items)
        {
            var existing = await _context.Set<DeliveryPlanItem>()
                .Include(dpi => dpi.Product)
                .Include(dpi => dpi.Outlet)
                .FirstOrDefaultAsync(dpi =>
                    dpi.DeliveryPlanId == planId &&
                    dpi.ProductId == itemDto.ProductId &&
                    dpi.OutletId == itemDto.OutletId,
                    cancellationToken);

            if (existing != null)
            {
                existing.FullQuantity = itemDto.FullQuantity;
                existing.MiniQuantity = itemDto.MiniQuantity;
                existing.IsExcluded = itemDto.IsExcluded;
                existing.Notes = itemDto.Notes;
                existing.UpdatedById = userId;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                results.Add(new DeliveryPlanItemDto
                {
                    Id = existing.Id,
                    DeliveryPlanId = existing.DeliveryPlanId,
                    ProductId = existing.ProductId,
                    ProductName = existing.Product!.Name,
                    OutletId = existing.OutletId,
                    OutletName = existing.Outlet!.Name,
                    FullQuantity = existing.FullQuantity,
                    MiniQuantity = existing.MiniQuantity,
                    IsExcluded = existing.IsExcluded,
                    Notes = existing.Notes
                });
            }
            else
            {
                var newItem = new DeliveryPlanItem
                {
                    Id = Guid.NewGuid(),
                    DeliveryPlanId = planId,
                    ProductId = itemDto.ProductId,
                    OutletId = itemDto.OutletId,
                    FullQuantity = itemDto.FullQuantity,
                    MiniQuantity = itemDto.MiniQuantity,
                    IsExcluded = itemDto.IsExcluded,
                    Notes = itemDto.Notes,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Set<DeliveryPlanItem>().Add(newItem);
                await _context.SaveChangesAsync(cancellationToken);

                var addedItem = await _context.Set<DeliveryPlanItem>()
                    .Include(dpi => dpi.Product)
                    .Include(dpi => dpi.Outlet)
                    .FirstAsync(dpi => dpi.Id == newItem.Id, cancellationToken);

                results.Add(new DeliveryPlanItemDto
                {
                    Id = addedItem.Id,
                    DeliveryPlanId = addedItem.DeliveryPlanId,
                    ProductId = addedItem.ProductId,
                    ProductName = addedItem.Product!.Name,
                    OutletId = addedItem.OutletId,
                    OutletName = addedItem.Outlet!.Name,
                    FullQuantity = addedItem.FullQuantity,
                    MiniQuantity = addedItem.MiniQuantity,
                    IsExcluded = addedItem.IsExcluded,
                    Notes = addedItem.Notes
                });
            }
        }

        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk upsert completed for plan {PlanNo}: {Count} items processed",
            plan.PlanNo, items.Count);

        return results;
    }

    public async Task<List<OutletDeliveryScheduleDto>> GetOutletScheduleAsync(
        DateTime fromDate,
        DateTime toDate,
        Guid? outletId = null,
        Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        var from = fromDate.Date;
        var to   = toDate.Date;

        var itemsQuery = _context.DeliveryPlanItems
            .AsNoTracking()
            .Include(i => i.DeliveryPlan)
                .ThenInclude(p => p.DeliveryTurn)
            .Include(i => i.Product)
            .Include(i => i.Outlet)
            .Include(i => i.WeightVariant)
            .Where(i => i.IsActive
                     && i.DeliveryPlan.PlanDate.Date >= from
                     && i.DeliveryPlan.PlanDate.Date <= to
                     && i.DeliveryPlan.Status != "Draft");

        if (outletId.HasValue)
            itemsQuery = itemsQuery.Where(i => i.OutletId == outletId.Value);

        if (deliveryTurnId.HasValue)
            itemsQuery = itemsQuery.Where(i => i.DeliveryPlan.DeliveryTurnId == deliveryTurnId.Value);

        itemsQuery = itemsQuery.Where(i => !i.IsExcluded);

        var items = await itemsQuery.ToListAsync(cancellationToken);

        var byOutlet = items
            .GroupBy(i => new { i.OutletId, OutletCode = i.Outlet?.Code ?? "", OutletName = i.Outlet?.Name ?? "" })
            .Select(og => new OutletDeliveryScheduleDto
            {
                OutletId   = og.Key.OutletId,
                OutletCode = og.Key.OutletCode,
                OutletName = og.Key.OutletName,
                Turns = og
                    .GroupBy(i => new
                    {
                        TurnId   = i.DeliveryPlan.DeliveryTurnId,
                        TurnName = i.DeliveryPlan.DeliveryTurn?.Name ?? "",
                        PlanId   = i.DeliveryPlanId,
                        PlanNo   = i.DeliveryPlan.PlanNo,
                        PlanDate = i.DeliveryPlan.PlanDate,
                        Status   = i.DeliveryPlan.Status
                    })
                    .Select(tg => new OutletTurnScheduleDto
                    {
                        DeliveryTurnId   = tg.Key.TurnId,
                        DeliveryTurnName = tg.Key.TurnName,
                        DeliveryPlanId   = tg.Key.PlanId,
                        PlanNo           = tg.Key.PlanNo,
                        PlanDate         = tg.Key.PlanDate,
                        Status           = tg.Key.Status,
                        Products = tg.Select(i => new OutletScheduleProductDto
                        {
                            ProductId         = i.ProductId,
                            ProductCode       = i.Product?.Code ?? "",
                            ProductName       = i.Product?.Name ?? "",
                            FullQuantity      = i.FullQuantity,
                            MiniQuantity      = i.MiniQuantity,
                            WeightVariantId   = i.WeightVariantId,
                            WeightVariantLabel = i.WeightVariant?.Label
                        })
                        .OrderBy(p => p.ProductCode)
                        .ToList()
                    })
                    .OrderBy(t => t.PlanDate).ThenBy(t => t.DeliveryTurnName)
                    .ToList()
            })
            .OrderBy(o => o.OutletCode)
            .ToList();

        return byOutlet;
    }

    public async Task<DeliveryPlanningWindowDto> GetPlanningWindowAsync(CancellationToken cancellationToken = default)
    {
        var (min, max) = DeliveryPlanPreloadRules.GetAllowedPlanDateRangeSriLanka();
        var dates = new List<string>();
        for (var d = min; d <= max; d = d.AddDays(1))
        {
            dates.Add(d.ToString("yyyy-MM-dd"));
        }

        var turnsRaw = await _context.Set<DeliveryTurn>()
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.TurnNumber)
            .ToListAsync(cancellationToken);

        var fiveAmTurns = turnsRaw
            .Where(t => DeliveryPlanPreloadRules.IsPreloadFiveAmDeliveryTime(t.DeliveryTime))
            .Select(t => new DeliveryTurnOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                DeliveryTimeDisplay = DeliveryPlanPreloadRules.FormatDeliveryTimeDisplay(t.DeliveryTime),
            })
            .ToList();

        return new DeliveryPlanningWindowDto
        {
            AllowedPlanDates = dates,
            MinPlanDate = min.ToString("yyyy-MM-dd"),
            MaxPlanDate = max.ToString("yyyy-MM-dd"),
            AvailableDeliveryTurns = fiveAmTurns,
        };
    }

    private async Task ValidatePreloadPlanHeaderAsync(
        DateOnly planDateSl,
        Guid deliveryTurnId,
        Guid dayTypeId,
        CancellationToken cancellationToken)
    {
        DeliveryPlanPreloadRules.ValidatePlanDateInPreloadWindow(planDateSl);

        var turn = await _context.Set<DeliveryTurn>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == deliveryTurnId && t.IsActive, cancellationToken)
            .ConfigureAwait(false);

        if (turn == null)
        {
            throw new InvalidOperationException("Delivery turn not found or inactive.");
        }

        if (!DeliveryPlanPreloadRules.IsPreloadFiveAmDeliveryTime(turn.DeliveryTime))
        {
            throw new InvalidOperationException(
                "Delivery preload plans must use the 5:00 AM slot. Configure an active delivery turn with delivery time 5:00 AM under Delivery Turns.");
        }

        var dayTypeOk = await _context.Set<DayType>()
            .AsNoTracking()
            .AnyAsync(d => d.Id == dayTypeId && d.IsActive, cancellationToken)
            .ConfigureAwait(false);

        if (!dayTypeOk)
        {
            throw new InvalidOperationException("Day type not found or inactive.");
        }
    }

    private async Task AssertNoDuplicatePlanAsync(
        DateOnly planDateSl,
        Guid deliveryTurnId,
        Guid dayTypeId,
        Guid? excludePlanId,
        CancellationToken cancellationToken)
    {
        var start = DeliveryPlanPreloadRules.SlDateToUtcMidnight(planDateSl);
        var end = DeliveryPlanPreloadRules.SlDateToUtcMidnight(planDateSl.AddDays(1));

        var query = _context.Set<DeliveryPlan>()
            .Where(p =>
                p.IsActive
                && p.DayTypeId == dayTypeId
                && p.DeliveryTurnId == deliveryTurnId
                && p.PlanDate >= start
                && p.PlanDate < end);

        if (excludePlanId.HasValue)
        {
            query = query.Where(p => p.Id != excludePlanId.Value);
        }

        if (await query.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            throw new InvalidOperationException(
                "A delivery plan already exists for this date, day type, and delivery turn.");
        }
    }
}
