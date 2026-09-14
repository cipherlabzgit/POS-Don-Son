using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class ProductPriceResolver : IProductPriceResolver
{
    private readonly ApplicationDbContext _context;

    public ProductPriceResolver(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<Guid, decimal>> ResolveAsync(
        IEnumerable<Guid> productIds,
        DateOnly asOf,
        CancellationToken cancellationToken = default)
    {
        var ids = productIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, decimal>();
        }

        var rows = await (
            from item in _context.PriceListItems.AsNoTracking()
            join list in _context.PriceLists.AsNoTracking() on item.PriceListId equals list.Id
            where ids.Contains(item.ProductId)
                  && list.IsActive
                  && list.PriceListType == PriceListService.StatusApproved
            select new
            {
                item.ProductId,
                item.UnitPrice,
                item.PreviousUnitPrice,
                list.EffectiveFrom,
                list.UpdatedAt,
            }).ToListAsync(cancellationToken);

        var result = new Dictionary<Guid, decimal>();
        foreach (var group in rows.GroupBy(r => r.ProductId))
        {
            var dated = group
                .Select(r => new
                {
                    r.UnitPrice,
                    r.PreviousUnitPrice,
                    EffectiveDate = DeliveryPlanPreloadRules.ResolvePlanBusinessDateSriLanka(r.EffectiveFrom),
                    r.UpdatedAt,
                })
                .ToList();

            var match = dated
                .Where(r => r.EffectiveDate <= asOf)
                .OrderByDescending(r => r.EffectiveDate)
                .ThenByDescending(r => r.UpdatedAt)
                .FirstOrDefault();

            if (match != null)
            {
                result[group.Key] = match.UnitPrice;
                continue;
            }

            var upcoming = dated
                .Where(r => r.EffectiveDate > asOf)
                .OrderBy(r => r.EffectiveDate)
                .ThenBy(r => r.UpdatedAt)
                .FirstOrDefault();

            if (upcoming != null)
            {
                result[group.Key] = upcoming.PreviousUnitPrice;
            }
        }

        return result;
    }
}
