namespace DMS_Backend.Models.DTOs.Reports;

public sealed class DailyShowroomTotalsReportRowDto
{
    public int RowNo { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public int BillCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CashAmount { get; set; }
    public decimal CardAmount { get; set; }
    public decimal OtherAmount { get; set; }
}

public sealed class DailyShowroomTotalsReportTotalsDto
{
    public int TotalBills { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCard { get; set; }
    public decimal TotalOther { get; set; }
}

public sealed class DailyShowroomTotalsReportDto
{
    public string ReportTitle { get; set; } = "Daily Showroom Totals";
    public string CompanyName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<DailyShowroomTotalsReportRowDto> Rows { get; set; } = Array.Empty<DailyShowroomTotalsReportRowDto>();
    public DailyShowroomTotalsReportTotalsDto Totals { get; set; } = new();
}
