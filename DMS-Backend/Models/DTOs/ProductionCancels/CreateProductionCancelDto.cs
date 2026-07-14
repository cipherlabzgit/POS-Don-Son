namespace DMS_Backend.Models.DTOs.ProductionCancels;

public sealed class CreateProductionCancelDto
{
    public required DateTime CancelDate { get; set; }
    public required string ProductionNo { get; set; } = string.Empty;
    public required string Reason { get; set; } = string.Empty;
    public required List<ProductionCancelLineDto> Lines { get; set; } = new();
}
