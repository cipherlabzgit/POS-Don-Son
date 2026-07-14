namespace DMS_Backend.Models.DTOs.Reports;

public sealed class DailySalesSystemBalanceReportRowDto
{
    public int RowNo { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int LineCount { get; set; }
}

public sealed class DailySalesSystemBalanceReportTotalsDto
{
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalLines { get; set; }
}

public sealed class DailySalesSystemBalanceReportDto
{
    public string ReportTitle { get; set; } = "Daily Sales (System Balance)";
    public string CompanyName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<DailySalesSystemBalanceReportRowDto> Rows { get; set; } = Array.Empty<DailySalesSystemBalanceReportRowDto>();
    public DailySalesSystemBalanceReportTotalsDto Totals { get; set; } = new();
}
