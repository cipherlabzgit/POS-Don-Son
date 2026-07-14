using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DeliverySummary;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DeliverySummaryService : IDeliverySummaryService
{
    private readonly ApplicationDbContext _context;

    public DeliverySummaryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DeliverySummaryDto?> GetDeliverySummaryAsync(DateTime date, Guid deliveryTurnId, string context = "production", CancellationToken cancellationToken = default)
    {
        date = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        bool isStoresContext = string.Equals(context, "stores", StringComparison.OrdinalIgnoreCase);

        var deliveryPlan = await _context.DeliveryPlans
            .Include(dp => dp.DeliveryTurn)
            .FirstOrDefaultAsync(dp => dp.PlanDate.Date == date && dp.DeliveryTurnId == deliveryTurnId, cancellationToken);

        if (deliveryPlan == null)
            return null;

        // Get regular order items with outlet and product info
        var orderItems = await _context.OrderItems
            .Include(oi => oi.Outlet)
            .Include(oi => oi.Product)
            .Include(oi => oi.OrderHeader)
            .Where(oi => oi.OrderHeader!.DeliveryPlanId == deliveryPlan.Id)
            .ToListAsync(cancellationToken);

        // Get confirmed/approved immediate orders for this date and turn
        var immediateOrders = await _context.ImmediateOrders
            .Include(io => io.Outlet)
            .Include(io => io.Product)
            .Where(io => io.OrderDate.Date == date &&
                         io.DeliveryTurnId == deliveryTurnId &&
                         (io.Status == "Confirmed" || io.Status == "Approved"))
            .ToListAsync(cancellationToken);

        // For stores context: load freezer stock keyed by productId
        // FreezerStock.CurrentStock is the aggregate across all sections for this product
        Dictionary<Guid, decimal> freezerStockByProduct = new();
        if (isStoresContext && deliveryPlan.UseFreezerStock)
        {
            var allProductIds = orderItems.Select(oi => oi.ProductId)
                .Union(immediateOrders.Select(io => io.ProductId))
                .Distinct()
                .ToList();

            freezerStockByProduct = await _context.FreezerStocks
                .Where(fs => allProductIds.Contains(fs.ProductId))
                .GroupBy(fs => fs.ProductId)
                .Select(g => new { ProductId = g.Key, Total = g.Sum(fs => fs.CurrentStock) })
                .ToDictionaryAsync(x => x.ProductId, x => x.Total, cancellationToken);
        }

        // Build outlet summaries merging order items and immediate orders
        var outletIds = orderItems.Select(oi => oi.OutletId)
            .Union(immediateOrders.Select(io => io.OutletId))
            .Distinct();

        var outletSummaries = new List<DeliveryOutletSummaryDto>();

        foreach (var outletId in outletIds)
        {
            var outletOrderItems = orderItems.Where(oi => oi.OutletId == outletId).ToList();
            var outletImmediateOrders = immediateOrders.Where(io => io.OutletId == outletId).ToList();

            var outlet = outletOrderItems.FirstOrDefault()?.Outlet
                      ?? outletImmediateOrders.FirstOrDefault()?.Outlet;

            if (outlet == null) continue;

            var productIds = outletOrderItems.Select(oi => oi.ProductId)
                .Union(outletImmediateOrders.Select(io => io.ProductId))
                .Distinct();

            var products = new List<DeliveryProductSummaryDto>();

            foreach (var productId in productIds)
            {
                var regularItems = outletOrderItems.Where(oi => oi.ProductId == productId && !oi.IsCustomized).ToList();
                var customizedItems = outletOrderItems.Where(oi => oi.ProductId == productId && oi.IsCustomized).ToList();
                var immediateRegular = outletImmediateOrders.Where(io => io.ProductId == productId && !io.IsCustomized).ToList();
                var immediateCustomized = outletImmediateOrders.Where(io => io.ProductId == productId && io.IsCustomized).ToList();

                var product = outletOrderItems.FirstOrDefault(oi => oi.ProductId == productId)?.Product
                           ?? outletImmediateOrders.FirstOrDefault(io => io.ProductId == productId)?.Product;

                if (product == null) continue;

                var regularFull = regularItems.Sum(oi => oi.FullQuantity) + immediateRegular.Sum(io => io.FullQuantity);
                var regularMini = regularItems.Sum(oi => oi.MiniQuantity) + immediateRegular.Sum(io => io.MiniQuantity);
                var customizedFull = customizedItems.Sum(oi => oi.FullQuantity) + immediateCustomized.Sum(io => io.FullQuantity);
                var customizedMini = customizedItems.Sum(oi => oi.MiniQuantity) + immediateCustomized.Sum(io => io.MiniQuantity);
                var totalQty = regularFull + regularMini + customizedFull + customizedMini;

                // Freezer balance is outlet-level proportional allocation not tracked per outlet;
                // freezer stock is a global pool — stores context shows it on the totals row, not per outlet.
                products.Add(new DeliveryProductSummaryDto
                {
                    ProductId = product.Id,
                    ProductCode = product.Code,
                    ProductName = product.Name,
                    RegularFullQty = regularFull,
                    RegularMiniQty = regularMini,
                    CustomizedFullQty = customizedFull,
                    CustomizedMiniQty = customizedMini,
                    TotalQty = totalQty,
                    FreezerBalance = 0,        // per-outlet freezer split not applicable; see ProductTotals
                    NetRequiredQty = totalQty  // same as total at outlet level; net shown in ProductTotals
                });
            }

            outletSummaries.Add(new DeliveryOutletSummaryDto
            {
                OutletId = outlet.Id,
                OutletCode = outlet.Code,
                OutletName = outlet.Name,
                Products = products.OrderBy(p => p.ProductCode).ToList()
            });
        }

        outletSummaries = outletSummaries.OrderBy(o => o.OutletCode).ToList();

        // Build product totals across all outlets (including immediate orders)
        var allProductIdsForTotals = orderItems.Select(oi => oi.ProductId)
            .Union(immediateOrders.Select(io => io.ProductId))
            .Distinct();

        var productTotals = new List<DeliveryProductTotalDto>();

        foreach (var productId in allProductIdsForTotals)
        {
            var regularItems = orderItems.Where(oi => oi.ProductId == productId && !oi.IsCustomized).ToList();
            var customizedItems = orderItems.Where(oi => oi.ProductId == productId && oi.IsCustomized).ToList();
            var immediateRegular = immediateOrders.Where(io => io.ProductId == productId && !io.IsCustomized).ToList();
            var immediateCustomized = immediateOrders.Where(io => io.ProductId == productId && io.IsCustomized).ToList();

            var product = orderItems.FirstOrDefault(oi => oi.ProductId == productId)?.Product
                       ?? immediateOrders.FirstOrDefault(io => io.ProductId == productId)?.Product;

            if (product == null) continue;

            var totalRegularFull = regularItems.Sum(oi => oi.FullQuantity) + immediateRegular.Sum(io => io.FullQuantity);
            var totalRegularMini = regularItems.Sum(oi => oi.MiniQuantity) + immediateRegular.Sum(io => io.MiniQuantity);
            var totalCustomizedFull = customizedItems.Sum(oi => oi.FullQuantity) + immediateCustomized.Sum(io => io.FullQuantity);
            var totalCustomizedMini = customizedItems.Sum(oi => oi.MiniQuantity) + immediateCustomized.Sum(io => io.MiniQuantity);
            var grandTotal = totalRegularFull + totalRegularMini + totalCustomizedFull + totalCustomizedMini;

            // Freezer balance: available stock for this product (only for stores context)
            var freezerBalance = isStoresContext && freezerStockByProduct.TryGetValue(productId, out var stock)
                ? Math.Min(stock, grandTotal)  // never deduct more than the total needed
                : 0m;

            productTotals.Add(new DeliveryProductTotalDto
            {
                ProductId = product.Id,
                ProductCode = product.Code,
                ProductName = product.Name,
                TotalRegularFull = totalRegularFull,
                TotalRegularMini = totalRegularMini,
                TotalCustomizedFull = totalCustomizedFull,
                TotalCustomizedMini = totalCustomizedMini,
                GrandTotal = grandTotal,
                TotalFreezerBalance = freezerBalance,
                NetGrandTotal = grandTotal - freezerBalance
            });
        }

        return new DeliverySummaryDto
        {
            DeliveryDate = deliveryPlan.PlanDate,
            DeliveryTurnId = deliveryTurnId,
            TurnName = deliveryPlan.DeliveryTurn?.Name ?? string.Empty,
            Context = context.ToLowerInvariant(),
            Outlets = outletSummaries,
            ProductTotals = productTotals.OrderBy(p => p.ProductCode).ToList()
        };
    }
}
