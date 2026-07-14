using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.DashboardStats;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DashboardStatsService : IDashboardStatsService
{
    private readonly ApplicationDbContext _context;

    public DashboardStatsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SalesTrendDto> GetSalesTrendAsync(int days, CancellationToken cancellationToken = default)
    {
        var toDate = DateTime.UtcNow.Date;
        var fromDate = toDate.AddDays(-(days - 1));

        var deliveries = await _context.Deliveries
            .Where(d => d.Status == DeliveryStatus.Approved
                     && d.DeliveryDate >= DateTime.SpecifyKind(fromDate, DateTimeKind.Utc)
                     && d.DeliveryDate <= DateTime.SpecifyKind(toDate.AddDays(1), DateTimeKind.Utc))
            .ToListAsync(cancellationToken);

        var points = Enumerable.Range(0, days)
            .Select(offset =>
            {
                var date = fromDate.AddDays(offset);
                var dayDeliveries = deliveries
                    .Where(d => d.DeliveryDate.Date == date)
                    .ToList();

                return new SalesTrendPointDto
                {
                    Date = date.ToString("dd MMM"),
                    TotalValue = dayDeliveries.Sum(d => d.TotalValue),
                    DeliveryCount = dayDeliveries.Count
                };
            })
            .ToList();

        return new SalesTrendDto
        {
            Points = points,
            GrandTotal = points.Sum(p => p.TotalValue)
        };
    }

    public async Task<DisposalBySectionDto> GetDisposalBySectionAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        var dateUtc = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var nextDayUtc = dateUtc.AddDays(1);

        var items = await _context.DisposalItems
            .Include(i => i.Product)
            .Include(i => i.Disposal)
            .Where(i => i.Disposal!.Status == DisposalStatus.Approved
                     && i.Disposal.DisposalDate >= dateUtc
                     && i.Disposal.DisposalDate < nextDayUtc)
            .ToListAsync(cancellationToken);

        var grouped = items
            .GroupBy(i => string.IsNullOrWhiteSpace(i.Product?.ProductionSection)
                ? "Others"
                : i.Product!.ProductionSection)
            .Select(g => new DisposalBySectionItemDto
            {
                Name = g.Key,
                Value = g.Sum(i => i.Quantity)
            })
            .OrderByDescending(x => x.Value)
            .ToList();

        return new DisposalBySectionDto
        {
            Date = date.ToString("yyyy-MM-dd"),
            Items = grouped,
            TotalDisposal = grouped.Sum(g => g.Value)
        };
    }

    public async Task<TopDeliveriesDto> GetTopDeliveriesAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        var dateUtc = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var nextDayUtc = dateUtc.AddDays(1);

        var deliveries = await _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.Items)
            .Where(d => d.Status == DeliveryStatus.Approved
                     && d.DeliveryDate >= dateUtc
                     && d.DeliveryDate < nextDayUtc)
            .ToListAsync(cancellationToken);

        var outlets = deliveries
            .GroupBy(d => d.OutletId)
            .Select(g =>
            {
                var outlet = g.First().Outlet;
                return new TopDeliveryOutletDto
                {
                    OutletCode = outlet?.Code ?? string.Empty,
                    OutletName = outlet?.Name ?? string.Empty,
                    DeliveryCount = g.Count(),
                    TotalQuantity = g.SelectMany(d => d.Items).Sum(i => i.Quantity)
                };
            })
            .OrderByDescending(o => o.DeliveryCount)
            .ThenByDescending(o => o.TotalQuantity)
            .Take(10)
            .ToList();

        return new TopDeliveriesDto
        {
            Date = date.ToString("yyyy-MM-dd"),
            Outlets = outlets
        };
    }

    public async Task<DeliveryVsDisposalDto> GetDeliveryVsDisposalAsync(int days, CancellationToken cancellationToken = default)
    {
        var toDate = DateTime.UtcNow.Date;
        var fromDate = toDate.AddDays(-(days - 1));
        var fromUtc = DateTime.SpecifyKind(fromDate, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(toDate.AddDays(1), DateTimeKind.Utc);

        var deliveryItems = await _context.DeliveryItems
            .Include(i => i.Product)
            .Include(i => i.Delivery)
            .Where(i => i.Delivery!.Status == DeliveryStatus.Approved
                     && i.Delivery.DeliveryDate >= fromUtc
                     && i.Delivery.DeliveryDate < toUtc)
            .ToListAsync(cancellationToken);

        var disposalItems = await _context.DisposalItems
            .Include(i => i.Product)
            .Include(i => i.Disposal)
            .Where(i => i.Disposal!.Status == DisposalStatus.Approved
                     && i.Disposal.DisposalDate >= fromUtc
                     && i.Disposal.DisposalDate < toUtc)
            .ToListAsync(cancellationToken);

        var allSections = deliveryItems
            .Select(i => string.IsNullOrWhiteSpace(i.Product?.ProductionSection) ? "Others" : i.Product!.ProductionSection)
            .Union(disposalItems
                .Select(i => string.IsNullOrWhiteSpace(i.Product?.ProductionSection) ? "Others" : i.Product!.ProductionSection))
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        var result = allSections.Select(section => new DeliveryVsDisposalItemDto
        {
            Category = section,
            DeliveryQty = deliveryItems
                .Where(i => (string.IsNullOrWhiteSpace(i.Product?.ProductionSection) ? "Others" : i.Product!.ProductionSection) == section)
                .Sum(i => i.Quantity),
            DisposalQty = disposalItems
                .Where(i => (string.IsNullOrWhiteSpace(i.Product?.ProductionSection) ? "Others" : i.Product!.ProductionSection) == section)
                .Sum(i => i.Quantity)
        }).ToList();

        return new DeliveryVsDisposalDto
        {
            FromDate = fromDate.ToString("yyyy-MM-dd"),
            ToDate = toDate.ToString("yyyy-MM-dd"),
            Items = result
        };
    }

    public async Task<SectionProductionSummaryDto> GetSectionProductionTotalsAsync(
        DateTime date, Guid? deliveryTurnId = null, CancellationToken cancellationToken = default)
    {
        var planDate = date.Date;

        var plansQuery = _context.DeliveryPlans
            .AsNoTracking()
            .Include(p => p.DeliveryTurn)
            .Include(p => p.DeliveryPlanItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(pr => pr!.ProductionSectionRef)
            .Where(p => p.PlanDate.Date == planDate && p.Status != "Draft");

        if (deliveryTurnId.HasValue)
            plansQuery = plansQuery.Where(p => p.DeliveryTurnId == deliveryTurnId.Value);

        var plans = await plansQuery.ToListAsync(cancellationToken);

        var allItems = plans
            .SelectMany(p => p.DeliveryPlanItems)
            .Where(i => i.IsActive)
            .ToList();

        // Group by ProductionSection entity (fallback to string field)
        var bySection = allItems
            .GroupBy(i => new
            {
                SectionId   = i.Product?.ProductionSectionId,
                SectionName = i.Product?.ProductionSectionRef?.Name ?? i.Product?.ProductionSection ?? "Unassigned",
                SectionCode = i.Product?.ProductionSectionRef?.Code ?? ""
            })
            .Select(g => new SectionProductionTotalDto
            {
                SectionId   = g.Key.SectionId ?? Guid.Empty,
                SectionName = g.Key.SectionName,
                SectionCode = g.Key.SectionCode,
                Items = g.GroupBy(i => new { i.ProductId, i.Product!.Code, i.Product.Name })
                          .Select(pg => new SectionProductItemDto
                          {
                              ProductId   = pg.Key.ProductId,
                              ProductCode = pg.Key.Code,
                              ProductName = pg.Key.Name,
                              FullQuantity = pg.Sum(x => x.FullQuantity),
                              MiniQuantity = pg.Sum(x => x.MiniQuantity)
                          })
                          .OrderBy(x => x.ProductCode)
                          .ToList(),
                TotalFullQty = g.Sum(x => x.FullQuantity),
                TotalMiniQty = g.Sum(x => x.MiniQuantity)
            })
            .OrderBy(s => s.SectionName)
            .ToList();

        var turnName = deliveryTurnId.HasValue
            ? plans.FirstOrDefault()?.DeliveryTurn?.Name
            : null;

        return new SectionProductionSummaryDto
        {
            Date             = planDate.ToString("yyyy-MM-dd"),
            DeliveryTurnId   = deliveryTurnId,
            DeliveryTurnName = turnName,
            Sections         = bySection
        };
    }

    public async Task<IngredientStockAlertSummaryDto> GetIngredientStockAlertsAsync(CancellationToken cancellationToken = default)
    {
        var ingredients = await _context.Ingredients
            .AsNoTracking()
            .Include(i => i.UnitOfMeasure)
            .Where(i => i.LowStockAlertEnabled || i.ReorderThreshold.HasValue)
            .OrderBy(i => i.Name)
            .ToListAsync(cancellationToken);

        var alerts = ingredients.Select(i => new IngredientStockSummaryItemDto
        {
            IngredientId    = i.Id,
            IngredientCode  = i.Code,
            IngredientName  = i.Name,
            UnitOfMeasure   = i.UnitOfMeasure?.Code ?? string.Empty,
            ReorderThreshold  = i.ReorderThreshold,
            LowStockThreshold = i.LowStockThreshold,
            IsLowStock   = i.LowStockAlertEnabled,
            NeedsReorder = i.ReorderThreshold.HasValue
        }).ToList();

        return new IngredientStockAlertSummaryDto
        {
            TotalLowStock    = alerts.Count(a => a.IsLowStock),
            TotalNeedsReorder = alerts.Count(a => a.NeedsReorder),
            Alerts = alerts
        };
    }
}
