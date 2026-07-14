namespace DMS_Backend.Models.DTOs.Reports;

public sealed class ReportRequest
{
    public string ReportType { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public Guid? OutletId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? CategoryId { get; set; }
}

public sealed class DeliveryReportRow
{
    public string DeliveryNo { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
}

public sealed class DisposalReportRow
{
    public string DisposalNo { get; set; } = string.Empty;
    public DateTime DisposalDate { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
}

public sealed class SalesReportRow
{
    public string SaleNo { get; set; } = string.Empty;
    public DateTime SoldAt { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? CashierName { get; set; }
}

public sealed class InventoryReportRow
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public string SectionName { get; set; } = string.Empty;
}

public sealed class ProductWiseReportRow
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalDelivered { get; set; }
    public decimal TotalDisposed { get; set; }
    public decimal TotalSold { get; set; }
    public decimal TotalValue { get; set; }
}

public sealed class ShowroomWiseReportRow
{
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public int TotalDeliveries { get; set; }
    public decimal TotalDeliveryValue { get; set; }
    public int TotalDisposals { get; set; }
    public decimal TotalSalesAmount { get; set; }
}

public sealed class CategoryWiseReportRow
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalDelivered { get; set; }
    public decimal TotalDisposed { get; set; }
    public decimal TotalValue { get; set; }
}

public sealed class DailySummaryRow
{
    public DateTime Date { get; set; }
    public int TotalDeliveries { get; set; }
    public decimal TotalDeliveryValue { get; set; }
    public int TotalDisposals { get; set; }
    public decimal TotalSalesAmount { get; set; }
}

public sealed class MonthlySummaryRow
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int TotalDeliveries { get; set; }
    public decimal TotalDeliveryValue { get; set; }
    public int TotalDisposals { get; set; }
    public decimal TotalSalesAmount { get; set; }
}

public sealed class ImmediateOrdersSummaryRequest
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public Guid? DeliveryTurnId { get; set; }
    public Guid? OutletId { get; set; }
    public string? Status { get; set; }
}

public sealed class ImmediateOrdersSummaryRow
{
    public string OrderNo { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string DeliveryTurnName { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
    public bool IsCustomized { get; set; }
    public string? CustomizationNotes { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ReportResponse<T>
{
    public string ReportType { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int TotalRows { get; set; }
    public List<T> Data { get; set; } = new();
}
