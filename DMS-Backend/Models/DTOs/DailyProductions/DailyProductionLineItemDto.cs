namespace DMS_Backend.Models.DTOs.DailyProductions;

public sealed class DailyProductionLineItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public decimal PlannedQty { get; set; }
    public decimal ProducedQty { get; set; }
    public string? Notes { get; set; }
}
