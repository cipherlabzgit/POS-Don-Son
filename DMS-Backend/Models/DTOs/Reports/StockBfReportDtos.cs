namespace DMS_Backend.Models.DTOs.Reports;

public sealed class StockBfReportOutletColumnDto
{
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
}

public sealed class StockBfReportRowDto
{
    public int RowNo { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    /// <summary>Quantities aligned with <see cref="StockBfReportDto.Showrooms"/> order.</summary>
    public IReadOnlyList<decimal> Quantities { get; set; } = Array.Empty<decimal>();
    public decimal RowTotal { get; set; }
}

public sealed class StockBfReportTotalsDto
{
    /// <summary>Per-showroom column totals (same order as <see cref="StockBfReportDto.Showrooms"/>).</summary>
    public IReadOnlyList<decimal> ColumnTotals { get; set; } = Array.Empty<decimal>();
    public decimal GrandTotal { get; set; }
}

public sealed class StockBfReportDto
{
    public string ReportTitle { get; set; } = "Stock BF Report";
    public string CompanyName { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime GeneratedAtUtc { get; set; }
    /// <summary>Active outlets (column order), left to right.</summary>
    public IReadOnlyList<StockBfReportOutletColumnDto> Showrooms { get; set; } = Array.Empty<StockBfReportOutletColumnDto>();
    public IReadOnlyList<StockBfReportRowDto> Rows { get; set; } = Array.Empty<StockBfReportRowDto>();
    public StockBfReportTotalsDto Totals { get; set; } = new();
}
