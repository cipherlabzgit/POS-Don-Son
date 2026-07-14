namespace DMS_Backend.Models.DTOs.Reports;

public sealed class DailySaleOfItemProductOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public sealed class DailySaleOfItemReportRowDto
{
    public int RowNo { get; set; }
    public DateOnly SaleDate { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int LineCount { get; set; }
}

public sealed class DailySaleOfItemReportTotalsDto
{
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalLines { get; set; }
}

public sealed class DailySaleOfItemReportDto
{
    public string ReportTitle { get; set; } = "Daily Sale Of Item";
    public string CompanyName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<DailySaleOfItemReportRowDto> Rows { get; set; } = Array.Empty<DailySaleOfItemReportRowDto>();
    public DailySaleOfItemReportTotalsDto Totals { get; set; } = new();
}
