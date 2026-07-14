using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Print;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class PrintService : IPrintService
{
    private readonly ApplicationDbContext _context;

    public PrintService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PrintReceiptCardDto?> GetReceiptCardAsync(Guid deliveryPlanId, Guid outletId, CancellationToken cancellationToken = default)
    {
        var deliveryPlan = await _context.DeliveryPlans
            .Include(dp => dp.DeliveryTurn)
            .FirstOrDefaultAsync(dp => dp.Id == deliveryPlanId, cancellationToken);

        if (deliveryPlan == null)
            return null;

        var outlet = await _context.Outlets
            .FirstOrDefaultAsync(o => o.Id == outletId, cancellationToken);

        if (outlet == null)
            return null;

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .Include(oi => oi.OrderHeader)
            .Where(oi => oi.OrderHeader!.DeliveryPlanId == deliveryPlanId && oi.OutletId == outletId)
            .ToListAsync(cancellationToken);

        var products = orderItems
            .GroupBy(oi => new { oi.ProductId, oi.IsCustomized })
            .Select(g => new ReceiptCardProductDto
            {
                ProductId = g.Key.ProductId,
                ProductCode = g.First().Product!.Code,
                ProductName = g.First().Product!.Name,
                FullQty = g.Sum(oi => oi.FullQuantity),
                MiniQty = g.Sum(oi => oi.MiniQuantity),
                IsCustomized = g.Key.IsCustomized,
                CustomizationNotes = g.First().CustomizationNotes
            })
            .OrderBy(p => p.ProductCode)
            .ToList();

        return new PrintReceiptCardDto
        {
            DeliveryPlanId = deliveryPlanId,
            DeliveryDate = deliveryPlan.PlanDate,
            TurnName = deliveryPlan.DeliveryTurn?.Name ?? string.Empty,
            OutletId = outletId,
            OutletCode = outlet.Code,
            OutletName = outlet.Name,
            OutletAddress = outlet.Address,
            ContactPerson = outlet.ContactPerson ?? string.Empty,
            ContactPhone = outlet.Phone ?? string.Empty,
            Products = products,
            TotalQuantity = products.Sum(p => p.FullQty + p.MiniQty),
            PrintedAt = DateTime.UtcNow
        };
    }

    public async Task<SectionPrintBundleDto?> GetSectionBundleAsync(Guid productionPlanId, Guid sectionId, CancellationToken cancellationToken = default)
    {
        var productionPlan = await _context.ProductionPlans
            .Include(pp => pp.DeliveryPlan)
                .ThenInclude(dp => dp!.DeliveryTurn)
            .FirstOrDefaultAsync(pp => pp.Id == productionPlanId, cancellationToken);

        if (productionPlan == null)
            return null;

        var section = await _context.ProductionSections
            .FirstOrDefaultAsync(ps => ps.Id == sectionId, cancellationToken);

        if (section == null)
            return null;

        // Load section timing from delivery turn
        var deliveryTurnId = productionPlan.DeliveryPlan?.DeliveryTurnId;
        Models.Entities.DeliveryTurnSectionTiming? sectionTiming = null;
        if (deliveryTurnId.HasValue)
        {
            sectionTiming = await _context.DeliveryTurnSectionTimings
                .FirstOrDefaultAsync(t => t.DeliveryTurnId == deliveryTurnId.Value &&
                                          t.ProductionSectionId == sectionId, cancellationToken);
        }

        var planItems = await _context.ProductionPlanItems
            .Include(ppi => ppi.Product)
            .Where(ppi => ppi.ProductionPlanId == productionPlanId && 
                         ppi.ProductionSectionId == sectionId && 
                         !ppi.IsExcluded)
            .ToListAsync(cancellationToken);

        // Get product IDs
        var productIds = planItems.Select(pi => pi.ProductId).Distinct().ToList();

        // Query recipes separately
        var recipes = await _context.Recipes
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.RecipeIngredients)
                    .ThenInclude(ri => ri.Ingredient)
                        .ThenInclude(i => i!.UnitOfMeasure)
            .Where(r => productIds.Contains(r.ProductId) && r.IsActive)
            .ToListAsync(cancellationToken);

        var recipesByProductId = recipes.ToDictionary(r => r.ProductId, r => r);

        var products = planItems.Select(ppi =>
        {
            var product = ppi.Product!;
            var hasRecipe = recipesByProductId.TryGetValue(product.Id, out var recipe);

            var ingredients = new List<SectionBundleIngredientDto>();

            if (hasRecipe && recipe != null)
            {
                foreach (var component in recipe.RecipeComponents)
                {
                    foreach (var recipeIngredient in component.RecipeIngredients)
                    {
                        var ingredient = recipeIngredient.Ingredient!;
                        var requiredQty = recipeIngredient.QtyPerUnit * ppi.ProduceQty;

                        ingredients.Add(new SectionBundleIngredientDto
                        {
                            IngredientId = ingredient.Id,
                            IngredientCode = ingredient.Code,
                            IngredientName = ingredient.Name,
                            Quantity = requiredQty,
                            Unit = ingredient.UnitOfMeasure?.Code ?? string.Empty
                        });
                    }
                }
            }

            return new SectionBundleProductDto
            {
                ProductId = product.Id,
                ProductCode = product.Code,
                ProductName = product.Name,
                ProduceQty = ppi.ProduceQty,
                HasRecipe = hasRecipe,
                Ingredients = ingredients.OrderBy(i => i.IngredientCode).ToList()
            };
        })
        .OrderBy(p => p.ProductCode)
        .ToList();

        // Compute timing display values
        DateTime? productionStartDt = null;
        DateTime? effectiveDeliveryDt = null;
        string? productionStartDisplay = null;
        string? effectiveDeliveryDisplay = null;

        if (sectionTiming != null)
        {
            var planDate = productionPlan.ComputedDate.Date;

            if (sectionTiming.ProductionStartTime.HasValue)
            {
                productionStartDt = planDate.AddDays(sectionTiming.ProductionDayOffset)
                    .Add(sectionTiming.ProductionStartTime.Value);
                var timeStr = sectionTiming.ProductionStartTime.Value.ToString(@"hh\:mm tt",
                    System.Globalization.CultureInfo.InvariantCulture);
                productionStartDisplay = sectionTiming.ProductionDayOffset < 0
                    ? $"{timeStr} (Previous Day)"
                    : sectionTiming.ProductionDayOffset > 0
                        ? $"{timeStr} (Next Day)"
                        : timeStr;
            }

            if (sectionTiming.EffectiveDeliveryTime.HasValue)
            {
                effectiveDeliveryDt = planDate.AddDays(sectionTiming.DeliveryDayOffset)
                    .Add(sectionTiming.EffectiveDeliveryTime.Value);
                var timeStr = sectionTiming.EffectiveDeliveryTime.Value.ToString(@"hh\:mm tt",
                    System.Globalization.CultureInfo.InvariantCulture);
                effectiveDeliveryDisplay = sectionTiming.DeliveryDayOffset < 0
                    ? $"{timeStr} (Previous Day)"
                    : sectionTiming.DeliveryDayOffset > 0
                        ? $"{timeStr} (Next Day)"
                        : timeStr;
            }
        }

        return new SectionPrintBundleDto
        {
            ProductionPlanId = productionPlanId,
            ProductionDate = productionPlan.ComputedDate,
            ProductionSectionId = sectionId,
            ProductionSectionName = section.Name,
            Products = products,
            TotalQuantity = products.Sum(p => p.ProduceQty),
            PrintedAt = DateTime.UtcNow,
            ProductionStartDateTime = productionStartDt,
            EffectiveDeliveryDateTime = effectiveDeliveryDt,
            ProductionStartDisplay = productionStartDisplay,
            EffectiveDeliveryDisplay = effectiveDeliveryDisplay
        };
    }
}
