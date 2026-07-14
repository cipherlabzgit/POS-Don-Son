namespace DMS_Backend.Models.DTOs.Reports;

public sealed class SalesSummaryReportRowDto
{
    public int RowNo { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public bool IsShowroomClosed { get; set; }
    /// <summary>Cashier-declared total for the date (cashier balance screen). Null if not entered or not applicable.</summary>
    public decimal? CashierShowroomSale { get; set; }
    /// <summary>Sum of approved POS sale totals for the showroom on the report date.</summary>
    public decimal SystemSale { get; set; }
    /// <summary>Cashier total minus system sale when cashier total exists and showroom is open.</summary>
    public decimal? Difference { get; set; }
}

public sealed class SalesSummaryReportTotalsDto
{
    public decimal? TotalCashierShowroomSale { get; set; }
    public decimal TotalSystemSale { get; set; }
    public decimal? TotalDifference { get; set; }
}

public sealed class SalesSummaryReportDto
{
    public string ReportTitle { get; set; } = "Sales Summary Report";
    public string CompanyName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<SalesSummaryReportRowDto> Rows { get; set; } = Array.Empty<SalesSummaryReportRowDto>();
    public SalesSummaryReportTotalsDto Totals { get; set; } = new();
}
