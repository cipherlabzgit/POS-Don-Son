using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("delivery")]
    [HasPermission("reports:delivery:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<DeliveryReportRow>>>> GetDeliveryReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var query = _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .Where(d => d.DeliveryDate >= from && d.DeliveryDate < to);

        if (request.OutletId.HasValue)
            query = query.Where(d => d.OutletId == request.OutletId.Value);

        var rows = await query
            .OrderByDescending(d => d.DeliveryDate)
            .Select(d => new DeliveryReportRow
            {
                DeliveryNo = d.DeliveryNo,
                DeliveryDate = d.DeliveryDate,
                OutletName = d.Outlet != null ? d.Outlet.Name : string.Empty,
                Status = d.Status.ToString(),
                TotalItems = d.TotalItems,
                TotalValue = d.TotalValue,
                CreatedByName = d.CreatedBy != null ? (d.CreatedBy.FullName ?? d.CreatedBy.Email) : null,
                ApprovedByName = d.ApprovedBy != null ? (d.ApprovedBy.FullName ?? d.ApprovedBy.Email) : null,
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<ReportResponse<DeliveryReportRow>>.SuccessResponse(new ReportResponse<DeliveryReportRow>
        {
            ReportType = "Delivery",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("disposal")]
    [HasPermission("reports:disposal:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<DisposalReportRow>>>> GetDisposalReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var query = _context.Disposals
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .Where(d => d.DisposalDate >= from && d.DisposalDate < to);

        if (request.OutletId.HasValue)
            query = query.Where(d => d.OutletId == request.OutletId.Value);

        var rows = await query
            .OrderByDescending(d => d.DisposalDate)
            .Select(d => new DisposalReportRow
            {
                DisposalNo = d.DisposalNo,
                DisposalDate = d.DisposalDate,
                OutletName = d.Outlet != null ? d.Outlet.Name : string.Empty,
                Status = d.Status.ToString(),
                TotalItems = d.TotalItems,
                CreatedByName = d.CreatedBy != null ? (d.CreatedBy.FullName ?? d.CreatedBy.Email) : null,
                ApprovedByName = d.ApprovedBy != null ? (d.ApprovedBy.FullName ?? d.ApprovedBy.Email) : null,
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<ReportResponse<DisposalReportRow>>.SuccessResponse(new ReportResponse<DisposalReportRow>
        {
            ReportType = "Disposal",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("sales")]
    [HasPermission("reports:sales:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<SalesReportRow>>>> GetSalesReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var query = _context.PosSales
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Where(s => s.IsActive && s.SoldAt >= from && s.SoldAt < to);

        if (request.OutletId.HasValue)
            query = query.Where(s => s.OutletId == request.OutletId.Value);

        var rows = await query
            .OrderByDescending(s => s.SoldAt)
            .Select(s => new SalesReportRow
            {
                SaleNo = s.SaleNo,
                SoldAt = s.SoldAt,
                OutletName = s.Outlet != null ? s.Outlet.Name : string.Empty,
                PaymentMethod = s.PaymentMethod,
                Status = s.Status.ToString(),
                TotalAmount = s.TotalAmount,
                CashierName = s.CreatedBy != null ? (s.CreatedBy.FullName ?? s.CreatedBy.Email) : null,
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<ReportResponse<SalesReportRow>>.SuccessResponse(new ReportResponse<SalesReportRow>
        {
            ReportType = "Sales",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("inventory")]
    [HasPermission("reports:inventory:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<InventoryReportRow>>>> GetInventoryReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var rows = await _context.FreezerStocks
            .Include(f => f.Product).ThenInclude(p => p.Category)
            .Include(f => f.ProductionSection)
            .Where(f => f.Product != null && f.Product.IsActive)
            .OrderBy(f => f.Product.Category != null ? f.Product.Category.Name : string.Empty)
            .ThenBy(f => f.Product.Name)
            .Select(f => new InventoryReportRow
            {
                ProductCode = f.Product.Code,
                ProductName = f.Product.Name,
                CategoryName = f.Product.Category != null ? f.Product.Category.Name : string.Empty,
                CurrentStock = f.CurrentStock,
                SectionName = f.ProductionSection != null ? f.ProductionSection.Name : string.Empty,
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<ReportResponse<InventoryReportRow>>.SuccessResponse(new ReportResponse<InventoryReportRow>
        {
            ReportType = "Inventory",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("product-wise")]
    [HasPermission("reports:product:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<ProductWiseReportRow>>>> GetProductWiseReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var deliveryItems = await _context.DeliveryItems
            .Include(i => i.Product).ThenInclude(p => p.Category)
            .Include(i => i.Delivery)
            .Where(i => i.Delivery != null &&
                        i.Delivery.DeliveryDate >= from &&
                        i.Delivery.DeliveryDate < to &&
                        i.Delivery.Status == DeliveryStatus.Approved)
            .GroupBy(i => new { i.ProductId, i.Product.Code, i.Product.Name, CategoryName = i.Product.Category != null ? i.Product.Category.Name : string.Empty })
            .Select(g => new { g.Key.ProductId, g.Key.Code, g.Key.Name, g.Key.CategoryName, TotalQty = g.Sum(i => i.Quantity), TotalVal = g.Sum(i => i.Quantity * i.UnitPrice) })
            .ToListAsync(cancellationToken);

        var disposalItems = await _context.DisposalItems
            .Include(i => i.Product)
            .Include(i => i.Disposal)
            .Where(i => i.Disposal != null &&
                        i.Disposal.DisposalDate >= from &&
                        i.Disposal.DisposalDate < to &&
                        i.Disposal.Status == DisposalStatus.Approved)
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, TotalQty = g.Sum(i => i.Quantity) })
            .ToListAsync(cancellationToken);

        var salesLines = await _context.PosSaleLines
            .Include(l => l.Product)
            .Include(l => l.PosSale)
            .Where(l => l.IsActive &&
                        l.PosSale != null &&
                        l.PosSale.SoldAt >= from &&
                        l.PosSale.SoldAt < to &&
                        l.PosSale.Status == PosSaleStatus.Approved)
            .GroupBy(l => l.ProductId)
            .Select(g => new { ProductId = g.Key, TotalQty = g.Sum(l => l.Quantity), TotalVal = g.Sum(l => l.LineTotal) })
            .ToListAsync(cancellationToken);

        var disposalLookup = disposalItems.ToDictionary(d => d.ProductId, d => d.TotalQty);
        var salesLookup = salesLines.ToDictionary(s => s.ProductId, s => (s.TotalQty, s.TotalVal));

        var rows = deliveryItems.Select(d => new ProductWiseReportRow
        {
            ProductCode = d.Code,
            ProductName = d.Name,
            CategoryName = d.CategoryName,
            TotalDelivered = d.TotalQty,
            TotalDisposed = disposalLookup.TryGetValue(d.ProductId, out var dispQty) ? dispQty : 0,
            TotalSold = salesLookup.TryGetValue(d.ProductId, out var sale) ? sale.TotalQty : 0,
            TotalValue = d.TotalVal + (salesLookup.TryGetValue(d.ProductId, out var sv) ? sv.TotalVal : 0),
        }).OrderBy(r => r.CategoryName).ThenBy(r => r.ProductName).ToList();

        return Ok(ApiResponse<ReportResponse<ProductWiseReportRow>>.SuccessResponse(new ReportResponse<ProductWiseReportRow>
        {
            ReportType = "Product Wise",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("showroom-wise")]
    [HasPermission("reports:showroom:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<ShowroomWiseReportRow>>>> GetShowroomWiseReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var outlets = await _context.Outlets
            .Where(o => o.IsActive)
            .OrderBy(o => o.Code)
            .ToListAsync(cancellationToken);

        var deliveries = await _context.Deliveries
            .Where(d => d.DeliveryDate >= from && d.DeliveryDate < to)
            .GroupBy(d => d.OutletId)
            .Select(g => new { OutletId = g.Key, Count = g.Count(), Value = g.Sum(d => d.TotalValue) })
            .ToListAsync(cancellationToken);

        var disposals = await _context.Disposals
            .Where(d => d.DisposalDate >= from && d.DisposalDate < to)
            .GroupBy(d => d.OutletId)
            .Select(g => new { OutletId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var sales = await _context.PosSales
            .Where(s => s.IsActive && s.SoldAt >= from && s.SoldAt < to)
            .GroupBy(s => s.OutletId)
            .Select(g => new { OutletId = g.Key, Amount = g.Sum(s => s.TotalAmount) })
            .ToListAsync(cancellationToken);

        var deliveryLookup = deliveries.ToDictionary(d => d.OutletId);
        var disposalLookup = disposals.ToDictionary(d => d.OutletId);
        var salesLookup = sales.ToDictionary(s => s.OutletId);

        var rows = outlets.Select(o => new ShowroomWiseReportRow
        {
            OutletCode = o.Code,
            OutletName = o.Name,
            TotalDeliveries = deliveryLookup.TryGetValue(o.Id, out var del) ? del.Count : 0,
            TotalDeliveryValue = deliveryLookup.TryGetValue(o.Id, out var delv) ? delv.Value : 0,
            TotalDisposals = disposalLookup.TryGetValue(o.Id, out var dis) ? dis.Count : 0,
            TotalSalesAmount = salesLookup.TryGetValue(o.Id, out var sal) ? sal.Amount : 0,
        }).ToList();

        return Ok(ApiResponse<ReportResponse<ShowroomWiseReportRow>>.SuccessResponse(new ReportResponse<ShowroomWiseReportRow>
        {
            ReportType = "Showroom Wise",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("category-wise")]
    [HasPermission("reports:category:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<CategoryWiseReportRow>>>> GetCategoryWiseReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var deliveryItems = await _context.DeliveryItems
            .Include(i => i.Product).ThenInclude(p => p.Category)
            .Include(i => i.Delivery)
            .Where(i => i.Delivery != null && i.Delivery.DeliveryDate >= from && i.Delivery.DeliveryDate < to)
            .GroupBy(i => i.Product.Category != null ? i.Product.Category.Name : "Uncategorized")
            .Select(g => new { Category = g.Key, TotalQty = g.Sum(i => i.Quantity), TotalVal = g.Sum(i => i.Quantity * i.UnitPrice) })
            .ToListAsync(cancellationToken);

        var disposalItems = await _context.DisposalItems
            .Include(i => i.Product).ThenInclude(p => p.Category)
            .Include(i => i.Disposal)
            .Where(i => i.Disposal != null && i.Disposal.DisposalDate >= from && i.Disposal.DisposalDate < to)
            .GroupBy(i => i.Product.Category != null ? i.Product.Category.Name : "Uncategorized")
            .Select(g => new { Category = g.Key, TotalQty = g.Sum(i => i.Quantity) })
            .ToListAsync(cancellationToken);

        var disposalLookup = disposalItems.ToDictionary(d => d.Category, d => d.TotalQty);

        var rows = deliveryItems.Select(d => new CategoryWiseReportRow
        {
            CategoryName = d.Category,
            TotalDelivered = d.TotalQty,
            TotalDisposed = disposalLookup.TryGetValue(d.Category, out var qty) ? qty : 0,
            TotalValue = d.TotalVal,
        }).OrderBy(r => r.CategoryName).ToList();

        return Ok(ApiResponse<ReportResponse<CategoryWiseReportRow>>.SuccessResponse(new ReportResponse<CategoryWiseReportRow>
        {
            ReportType = "Category Wise",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("daily-summary")]
    [HasPermission("reports:daily:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<DailySummaryRow>>>> GetDailySummaryReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var deliveries = await _context.Deliveries
            .Where(d => d.DeliveryDate >= from && d.DeliveryDate < to)
            .GroupBy(d => d.DeliveryDate.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Value = g.Sum(d => d.TotalValue) })
            .ToListAsync(cancellationToken);

        var disposals = await _context.Disposals
            .Where(d => d.DisposalDate >= from && d.DisposalDate < to)
            .GroupBy(d => d.DisposalDate.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var sales = await _context.PosSales
            .Where(s => s.IsActive && s.SoldAt >= from && s.SoldAt < to)
            .GroupBy(s => s.SoldAt.Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(s => s.TotalAmount) })
            .ToListAsync(cancellationToken);

        var deliveryLookup = deliveries.ToDictionary(d => d.Date);
        var disposalLookup = disposals.ToDictionary(d => d.Date);
        var salesLookup = sales.ToDictionary(s => s.Date);

        var allDates = deliveryLookup.Keys
            .Union(disposalLookup.Keys)
            .Union(salesLookup.Keys)
            .OrderBy(d => d)
            .ToList();

        var rows = allDates.Select(date => new DailySummaryRow
        {
            Date = date,
            TotalDeliveries = deliveryLookup.TryGetValue(date, out var del) ? del.Count : 0,
            TotalDeliveryValue = deliveryLookup.TryGetValue(date, out var delv) ? delv.Value : 0,
            TotalDisposals = disposalLookup.TryGetValue(date, out var dis) ? dis.Count : 0,
            TotalSalesAmount = salesLookup.TryGetValue(date, out var sal) ? sal.Amount : 0,
        }).ToList();

        return Ok(ApiResponse<ReportResponse<DailySummaryRow>>.SuccessResponse(new ReportResponse<DailySummaryRow>
        {
            ReportType = "Daily Summary",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("monthly-summary")]
    [HasPermission("reports:monthly:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<MonthlySummaryRow>>>> GetMonthlySummaryReport(
        [FromBody] ReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var deliveries = await _context.Deliveries
            .Where(d => d.DeliveryDate >= from && d.DeliveryDate < to)
            .GroupBy(d => new { d.DeliveryDate.Year, d.DeliveryDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count(), Value = g.Sum(d => d.TotalValue) })
            .ToListAsync(cancellationToken);

        var disposals = await _context.Disposals
            .Where(d => d.DisposalDate >= from && d.DisposalDate < to)
            .GroupBy(d => new { d.DisposalDate.Year, d.DisposalDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var sales = await _context.PosSales
            .Where(s => s.IsActive && s.SoldAt >= from && s.SoldAt < to)
            .GroupBy(s => new { s.SoldAt.Year, s.SoldAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Amount = g.Sum(s => s.TotalAmount) })
            .ToListAsync(cancellationToken);

        var deliveryLookup = deliveries.ToDictionary(d => (d.Year, d.Month));
        var disposalLookup = disposals.ToDictionary(d => (d.Year, d.Month));
        var salesLookup = sales.ToDictionary(s => (s.Year, s.Month));

        var allMonths = deliveryLookup.Keys
            .Union(disposalLookup.Keys)
            .Union(salesLookup.Keys)
            .OrderBy(m => m)
            .ToList();

        var rows = allMonths.Select(m => new MonthlySummaryRow
        {
            Year = m.Year,
            Month = m.Month,
            MonthName = new DateTime(m.Year, m.Month, 1).ToString("MMMM yyyy"),
            TotalDeliveries = deliveryLookup.TryGetValue(m, out var del) ? del.Count : 0,
            TotalDeliveryValue = deliveryLookup.TryGetValue(m, out var delv) ? delv.Value : 0,
            TotalDisposals = disposalLookup.TryGetValue(m, out var dis) ? dis.Count : 0,
            TotalSalesAmount = salesLookup.TryGetValue(m, out var sal) ? sal.Amount : 0,
        }).ToList();

        return Ok(ApiResponse<ReportResponse<MonthlySummaryRow>>.SuccessResponse(new ReportResponse<MonthlySummaryRow>
        {
            ReportType = "Monthly Summary",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }

    [HttpPost("immediate-orders-summary")]
    [HasPermission("reports:immediate-orders:view")]
    public async Task<ActionResult<ApiResponse<ReportResponse<ImmediateOrdersSummaryRow>>>> GetImmediateOrdersSummary(
        [FromBody] ImmediateOrdersSummaryRequest request,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);

        var query = _context.ImmediateOrders
            .Include(io => io.DeliveryTurn)
            .Include(io => io.Outlet)
            .Include(io => io.Product)
            .Include(io => io.ApprovedByUser)
            .Where(io => io.OrderDate >= from && io.OrderDate < to);

        if (request.DeliveryTurnId.HasValue)
            query = query.Where(io => io.DeliveryTurnId == request.DeliveryTurnId.Value);

        if (request.OutletId.HasValue)
            query = query.Where(io => io.OutletId == request.OutletId.Value);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(io => io.Status == request.Status);

        var rows = await query
            .OrderByDescending(io => io.OrderDate)
            .ThenBy(io => io.OrderNo)
            .Select(io => new ImmediateOrdersSummaryRow
            {
                OrderNo = io.OrderNo,
                OrderDate = io.OrderDate,
                DeliveryTurnName = io.DeliveryTurn != null ? io.DeliveryTurn.Name : string.Empty,
                OutletName = io.Outlet != null ? io.Outlet.Name : string.Empty,
                ProductCode = io.Product != null ? io.Product.Code : string.Empty,
                ProductName = io.Product != null ? io.Product.Name : string.Empty,
                FullQuantity = io.FullQuantity,
                MiniQuantity = io.MiniQuantity,
                IsCustomized = io.IsCustomized,
                CustomizationNotes = io.CustomizationNotes,
                RequestedBy = io.RequestedBy,
                Reason = io.Reason,
                Status = io.Status,
                ApprovedByName = io.ApprovedByUser != null ? (io.ApprovedByUser.FullName ?? io.ApprovedByUser.Email) : null,
                ApprovedAt = io.ApprovedAt,
                CreatedAt = io.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<ReportResponse<ImmediateOrdersSummaryRow>>.SuccessResponse(new ReportResponse<ImmediateOrdersSummaryRow>
        {
            ReportType = "Immediate Orders Summary",
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalRows = rows.Count,
            Data = rows
        }));
    }
}
