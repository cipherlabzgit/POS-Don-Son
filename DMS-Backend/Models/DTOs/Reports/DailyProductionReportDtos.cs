namespace DMS_Backend.Models.DTOs.Reports;

public sealed class DailyProductionReportRowDto
{
    public int RowNo { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    /// <summary>Distinct production sections for this product on the report date (comma-separated).</summary>
    public string Sections { get; set; } = string.Empty;
    public decimal PlannedQty { get; set; }
    public decimal ProducedQty { get; set; }
    public decimal VarianceQty { get; set; }
    /// <summary>Single status label, or "Mixed" when multiple statuses appear for the same product.</summary>
    public string StatusSummary { get; set; } = string.Empty;
    /// <summary>Number of underlying daily production lines aggregated into this row.</summary>
    public int LineCount { get; set; }
}

public sealed class DailyProductionReportTotalsDto
{
    public decimal TotalPlannedQty { get; set; }
    public decimal TotalProducedQty { get; set; }
    public decimal TotalVarianceQty { get; set; }
}

public sealed class DailyProductionReportDto
{
    public string ReportTitle { get; set; } = "Daily Production";
    public string CompanyName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    public IReadOnlyList<DailyProductionReportRowDto> Rows { get; set; } = Array.Empty<DailyProductionReportRowDto>();
    public DailyProductionReportTotalsDto Totals { get; set; } = new();
}
