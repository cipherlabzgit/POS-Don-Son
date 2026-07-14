using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.ProductionPlans;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ProductionPlannerService : IProductionPlannerService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProductionPlannerService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ComputeProductionPlanResponseDto> ComputeProductionPlanAsync(Guid deliveryPlanId, bool useFreezerStock, CancellationToken cancellationToken = default)
    {
        var deliveryPlan = await _context.DeliveryPlans
            .FirstOrDefaultAsync(dp => dp.Id == deliveryPlanId, cancellationToken);

        if (deliveryPlan == null)
            throw new InvalidOperationException("Delivery plan not found");

        // Get order items with products
        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .Include(oi => oi.OrderHeader)
            .Where(oi => oi.OrderHeader!.DeliveryPlanId == deliveryPlanId)
            .ToListAsync(cancellationToken);

        // Get all production sections to map names
        var productionSections = await _context.ProductionSections.ToListAsync(cancellationToken);
        var sectionLookup = productionSections.ToDictionary(s => s.Name, s => s);

        var productQuantities = orderItems
            .GroupBy(oi => new { oi.ProductId, ProductionSection = oi.Product!.ProductionSection, oi.IsCustomized })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.ProductionSection,
                g.Key.IsCustomized,
                Product = g.First().Product,
                FullQty = g.Sum(oi => oi.FullQuantity),
                MiniQty = g.Sum(oi => oi.MiniQuantity)
            })
            .ToList();

        var computedItems = new List<ComputedProductionItemDto>();

        foreach (var group in productQuantities.GroupBy(pq => new { pq.ProductionSection, pq.ProductId }))
        {
            var regularGroup = group.FirstOrDefault(g => !g.IsCustomized);
            var customizedGroup = group.FirstOrDefault(g => g.IsCustomized);

            var product = group.First().Product!;
            var sectionName = product.ProductionSection ?? string.Empty;
            var section = sectionLookup.ContainsKey(sectionName) ? sectionLookup[sectionName] : null;

            decimal regularFullQty = regularGroup?.FullQty ?? 0;
            decimal regularMiniQty = regularGroup?.MiniQty ?? 0;
            decimal customizedFullQty = customizedGroup?.FullQty ?? 0;
            decimal customizedMiniQty = customizedGroup?.MiniQty ?? 0;
            decimal totalRequiredQty = regularFullQty + regularMiniQty + customizedFullQty + customizedMiniQty;

            decimal freezerStock = 0;
            if (useFreezerStock && section != null)
            {
                var stockRecord = await _context.FreezerStocks
                    .Where(fs => fs.ProductId == product.Id && fs.ProductionSectionId == section.Id)
                    .OrderByDescending(fs => fs.UpdatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                freezerStock = stockRecord?.CurrentStock ?? 0;
            }

            // Production needs full count — freezer stock deduction is for stores only
            decimal rawProduceQty = totalRequiredQty;
            // Round up to nearest RoundingValue increment (e.g., RoundingValue=5: 97→100)
            decimal produceQty = product.RoundingValue > 1
                ? Math.Ceiling(rawProduceQty / product.RoundingValue) * product.RoundingValue
                : rawProduceQty;

            // Stores qty deducts freezer stock (stores issues less than what production makes)
            decimal rawStoresQty = Math.Max(0, totalRequiredQty - freezerStock);
            decimal storesQty = product.RoundingValue > 1
                ? Math.Ceiling(rawStoresQty / product.RoundingValue) * product.RoundingValue
                : rawStoresQty;

            computedItems.Add(new ComputedProductionItemDto
            {
                ProductionSectionId = section?.Id ?? Guid.Empty,
                ProductionSectionName = sectionName,
                ProductId = product.Id,
                ProductCode = product.Code,
                ProductName = product.Name,
                RegularFullQty = regularFullQty,
                RegularMiniQty = regularMiniQty,
                CustomizedFullQty = customizedFullQty,
                CustomizedMiniQty = customizedMiniQty,
                TotalRequiredQty = totalRequiredQty,
                FreezerStock = freezerStock,
                StandardQty = rawProduceQty,
                ProduceQty = produceQty,
                StoresQty = storesQty
            });
        }

        return new ComputeProductionPlanResponseDto
        {
            DeliveryPlanId = deliveryPlanId,
            UseFreezerStock = useFreezerStock,
            Items = computedItems.OrderBy(i => i.ProductionSectionName).ThenBy(i => i.ProductCode).ToList(),
            TotalProducts = computedItems.Count,
            TotalQuantity = computedItems.Sum(i => i.ProduceQty)
        };
    }

    public async Task<ProductionPlanDetailDto> CreateProductionPlanAsync(CreateProductionPlanDto dto, CancellationToken cancellationToken = default)
    {
        var existingPlan = await _context.ProductionPlans
            .FirstOrDefaultAsync(pp => pp.DeliveryPlanId == dto.DeliveryPlanId, cancellationToken);

        if (existingPlan != null)
            throw new InvalidOperationException("Production plan already exists for this delivery plan");

        var plan = new ProductionPlan
        {
            Id = Guid.NewGuid(),
            DeliveryPlanId = dto.DeliveryPlanId,
            ComputedDate = DateTime.UtcNow,
            Status = ProductionPlanStatus.Pending,
            UseFreezerStock = dto.UseFreezerStock,
            TotalProducts = dto.Items.Count,
            TotalQuantity = dto.Items.Sum(i => i.ProduceQty),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var itemDto in dto.Items)
        {
            var item = new ProductionPlanItem
            {
                Id = Guid.NewGuid(),
                ProductionPlanId = plan.Id,
                ProductionSectionId = itemDto.ProductionSectionId,
                ProductId = itemDto.ProductId,
                RegularFullQty = itemDto.RegularFullQty,
                RegularMiniQty = itemDto.RegularMiniQty,
                CustomizedFullQty = itemDto.CustomizedFullQty,
                CustomizedMiniQty = itemDto.CustomizedMiniQty,
                FreezerStock = itemDto.FreezerStock,
                ProduceQty = itemDto.ProduceQty,
                IsExcluded = itemDto.IsExcluded,
                CreatedAt = DateTime.UtcNow
            };

            plan.ProductionPlanItems.Add(item);
        }

        _context.ProductionPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetProductionPlanByIdAsync(plan.Id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve created plan");
    }

    public async Task<ProductionPlanDetailDto?> GetProductionPlanByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.ProductionPlans
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.ProductionSection)
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.Product)
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.ProductionAdjustments)
            .FirstOrDefaultAsync(pp => pp.Id == id, cancellationToken);

        if (plan == null)
            return null;

        return _mapper.Map<ProductionPlanDetailDto>(plan);
    }

    public async Task<ProductionPlanDetailDto?> GetProductionPlanByDeliveryPlanIdAsync(Guid deliveryPlanId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.ProductionPlans
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.ProductionSection)
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.Product)
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.ProductionAdjustments)
            .FirstOrDefaultAsync(pp => pp.DeliveryPlanId == deliveryPlanId, cancellationToken);

        if (plan == null)
            return null;

        return _mapper.Map<ProductionPlanDetailDto>(plan);
    }

    public async Task<List<ProductionPlanListDto>> GetAllProductionPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.ProductionPlans
            .Include(pp => pp.DeliveryPlan)
            .OrderByDescending(pp => pp.ComputedDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ProductionPlanListDto>>(plans);
    }

    public async Task<ProductionPlanDetailDto?> UpdateProductionPlanAsync(Guid id, UpdateProductionPlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.ProductionPlans
            .Include(pp => pp.ProductionPlanItems)
            .FirstOrDefaultAsync(pp => pp.Id == id, cancellationToken);

        if (plan == null)
            return null;

        if (dto.Status.HasValue)
            plan.Status = dto.Status.Value;

        if (dto.UseFreezerStock.HasValue)
            plan.UseFreezerStock = dto.UseFreezerStock.Value;

        if (dto.Items != null)
        {
            foreach (var itemDto in dto.Items)
            {
                var item = plan.ProductionPlanItems.FirstOrDefault(i => i.Id == itemDto.Id);
                if (item != null)
                {
                    if (itemDto.ProduceQty.HasValue)
                        item.ProduceQty = itemDto.ProduceQty.Value;

                    if (itemDto.IsExcluded.HasValue)
                        item.IsExcluded = itemDto.IsExcluded.Value;

                    item.UpdatedAt = DateTime.UtcNow;
                }
            }

            plan.TotalQuantity = plan.ProductionPlanItems.Where(i => !i.IsExcluded).Sum(i => i.ProduceQty);
        }

        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetProductionPlanByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteProductionPlanAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.ProductionPlans
            .Include(pp => pp.ProductionPlanItems)
                .ThenInclude(ppi => ppi.ProductionAdjustments)
            .FirstOrDefaultAsync(pp => pp.Id == id, cancellationToken);

        if (plan == null)
            return false;

        _context.ProductionPlans.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ProductionAdjustmentDto> ApplyAdjustmentAsync(CreateProductionAdjustmentDto dto, CancellationToken cancellationToken = default)
    {
        var item = await _context.ProductionPlanItems
            .Include(ppi => ppi.ProductionPlan)
            .FirstOrDefaultAsync(ppi => ppi.Id == dto.ProductionPlanItemId, cancellationToken);

        if (item == null)
            throw new InvalidOperationException("Production plan item not found");

        var adjustment = new ProductionAdjustment
        {
            Id = Guid.NewGuid(),
            ProductionPlanItemId = dto.ProductionPlanItemId,
            AdjustmentQty = dto.AdjustmentQty,
            Reason = dto.Reason,
            AdjustedBy = dto.AdjustedBy,
            AdjustedAt = DateTime.UtcNow
        };

        item.ProduceQty += dto.AdjustmentQty;
        item.UpdatedAt = DateTime.UtcNow;

        if (item.ProductionPlan != null)
        {
            item.ProductionPlan.TotalQuantity = await _context.ProductionPlanItems
                .Where(ppi => ppi.ProductionPlanId == item.ProductionPlanId && !ppi.IsExcluded)
                .SumAsync(ppi => ppi.ProduceQty, cancellationToken);
            item.ProductionPlan.UpdatedAt = DateTime.UtcNow;
        }

        _context.ProductionAdjustments.Add(adjustment);
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductionAdjustmentDto>(adjustment);
    }
}
