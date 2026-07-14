namespace DMS_Backend.Models.DTOs.DailyProductionPlans;

public sealed class CreateDailyProductionPlanDto
{
    public required DateTime PlanDate { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal PlannedQty { get; set; }
    public required string Priority { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? Comment { get; set; }
    public string? Notes { get; set; }
}
