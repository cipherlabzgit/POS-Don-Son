namespace DMS_Backend.Models.DTOs.ProductionCancels;

public sealed class ProductionCancelDetailDto
{
    public Guid Id { get; set; }
    public string CancelNo { get; set; } = string.Empty;
    public DateTime CancelDate { get; set; }
    public string ProductionNo { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalQty { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<ProductionCancelLineItemDto> Lines { get; set; } = new();
}
