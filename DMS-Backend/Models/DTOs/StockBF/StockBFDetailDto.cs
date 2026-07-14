namespace DMS_Backend.Models.DTOs.StockBF;

public sealed class StockBFDetailDto
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
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public Guid? RejectedById { get; set; }
    public string? RejectedByName { get; set; }
    public DateTime? RejectedDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}
