namespace DMS_Backend.Models.DTOs.DashboardPivot;

public class DashboardPivotDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<DashboardPivotRowDto> Rows { get; set; } = new();
    public List<string> DateColumns { get; set; } = new();
    public Dictionary<string, decimal> ProductTotals { get; set; } = new();
}

public class DashboardPivotRowDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Dictionary<string, DashboardPivotCellDto> DateValues { get; set; } = new();
    public decimal RowTotal { get; set; }
}

public class DashboardPivotCellDto
{
    public DateTime Date { get; set; }
    public decimal Quantity { get; set; }
    public int OutletCount { get; set; }
    public int OrderCount { get; set; }
}
