namespace DMS_Backend.Models.DTOs.StockBF;

/// <summary>List row for Stock BF grids (matches POS-style columns).</summary>
public sealed class StockBFListDto
{
    public Guid Id { get; set; }
    public string BFNo { get; set; } = string.Empty;
    public DateTime BFDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UpdatedByName { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectedByName { get; set; }
    public DateTime? RejectedDate { get; set; }
}
