namespace DMS_Backend.Models.DTOs.DailyProductions;

public sealed class UpdateDailyProductionDto
{
    public required DateTime ProductionDate { get; set; }
    public required Guid ProductId { get; set; }
    public required Guid ProductionSectionId { get; set; }
    public required decimal PlannedQty { get; set; }
    public required decimal ProducedQty { get; set; }
    public required Guid ShiftId { get; set; }
    public string? Notes { get; set; }
}
