namespace DMS_Backend.Models.DTOs.ProductionCancels;

public sealed class ProductionCancelLineDto
{
    public Guid ProductId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public decimal CancelledQty { get; set; }
}
