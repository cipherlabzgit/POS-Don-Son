namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class CreateProductionAdjustmentDto
{
    public Guid ProductionPlanItemId { get; set; }
    public decimal AdjustmentQty { get; set; }
    public string? Reason { get; set; }
    public Guid AdjustedBy { get; set; }
}
