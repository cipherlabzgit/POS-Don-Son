namespace DMS_Backend.Models.DTOs.ProductionCancels;

public sealed class ProductionCancelLineItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public decimal CancelledQty { get; set; }
    public int LineNo { get; set; }
}
