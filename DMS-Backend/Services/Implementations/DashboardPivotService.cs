using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DashboardPivot;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DashboardPivotService : IDashboardPivotService
{
    private readonly ApplicationDbContext _context;

    public DashboardPivotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardPivotDto> GetDashboardPivotAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        // Npgsql requires UTC for timestamptz parameters; query-string binding yields Unspecified.
        fromDate = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        toDate = DateTime.SpecifyKind(toDate.Date, DateTimeKind.Utc);

        var deliveryPlans = await _context.DeliveryPlans
            .Where(dp => dp.PlanDate >= fromDate && dp.PlanDate <= toDate)
            .ToListAsync(cancellationToken);

        var deliveryPlanIds = deliveryPlans.Select(dp => dp.Id).ToList();

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .Include(oi => oi.Outlet)
            .Include(oi => oi.OrderHeader)
                .ThenInclude(oh => oh!.DeliveryPlan)
            .Where(oi => oi.OrderHeader!.DeliveryPlanId != null && deliveryPlanIds.Contains(oi.OrderHeader.DeliveryPlanId.Value))
            .ToListAsync(cancellationToken);

        var dateColumns = Enumerable.Range(0, (toDate - fromDate).Days + 1)
            .Select(offset => fromDate.AddDays(offset).ToString("yyyy-MM-dd"))
            .ToList();

        var allProducts = orderItems
            .Select(oi => oi.Product)
            .DistinctBy(p => p!.Id)
            .OrderBy(p => p!.Code)
            .ToList();

        var rows = allProducts.Select(product =>
        {
            var dateValues = new Dictionary<string, DashboardPivotCellDto>();
            decimal rowTotal = 0;

            foreach (var dateStr in dateColumns)
            {
                var date = DateTime.SpecifyKind(DateTime.Parse(dateStr), DateTimeKind.Utc);
                var dayItems = orderItems
                    .Where(oi => oi.OrderHeader!.DeliveryPlan!.PlanDate.Date == date && oi.ProductId == product!.Id)
                    .ToList();

                var dayQuantity = dayItems.Sum(oi => oi.FullQuantity + oi.MiniQuantity);

                var outletCount = dayItems
                    .Select(oi => oi.OutletId)
                    .Distinct()
                    .Count();

                var orderCount = dayItems
                    .Select(oi => oi.OrderHeaderId)
                    .Distinct()
                    .Count();

                dateValues[dateStr] = new DashboardPivotCellDto
                {
                    Date = date,
                    Quantity = dayQuantity,
                    OutletCount = outletCount,
                    OrderCount = orderCount
                };

                rowTotal += dayQuantity;
            }

            return new DashboardPivotRowDto
            {
                ProductId = product!.Id,
                ProductCode = product.Code,
                ProductName = product.Name,
                DateValues = dateValues,
                RowTotal = rowTotal
            };
        }).ToList();

        var productTotals = dateColumns.ToDictionary(
            dateStr => dateStr,
            dateStr => rows.Sum(r => r.DateValues.ContainsKey(dateStr) ? r.DateValues[dateStr].Quantity : 0)
        );

        return new DashboardPivotDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            DateColumns = dateColumns,
            Rows = rows,
            ProductTotals = productTotals
        };
    }
}
