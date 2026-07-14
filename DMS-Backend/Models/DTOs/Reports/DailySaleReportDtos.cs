namespace DMS_Backend.Models.DTOs.Reports;

/// <summary>Minimal showroom row for Daily Sale Report filter dropdown.</summary>
public sealed class DailySaleReportShowroomOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public sealed class DailySaleReportRowDto
{
    public int RowNo { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int LineCount { get; set; }
}

public sealed class DailySaleReportTotalsDto
{
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalLines { get; set; }
}

public sealed class DailySaleReportDto
{
    public string ReportTitle { get; set; } = "Daily Sale Report";
    public string CompanyName { get; set; } = string.Empty;
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<DailySaleReportRowDto> Rows { get; set; } = Array.Empty<DailySaleReportRowDto>();
    public DailySaleReportTotalsDto Totals { get; set; } = new();
}
