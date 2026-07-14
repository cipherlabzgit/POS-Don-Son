namespace DMS_Backend.Models.DTOs.StockAdjustments;

public sealed class UpdateStockAdjustmentDto
{
    public required DateTime AdjustmentDate { get; set; }
    public required Guid ProductId { get; set; }
    public required Guid ProductionSectionId { get; set; }
    public required string AdjustmentType { get; set; } = string.Empty;
    public required decimal Quantity { get; set; }
    public required string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
