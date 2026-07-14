namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ProductionAdjustmentDto
{
    public Guid Id { get; set; }
    public Guid ProductionPlanItemId { get; set; }
    public decimal AdjustmentQty { get; set; }
    public string? Reason { get; set; }
    public Guid AdjustedBy { get; set; }
    public string AdjustedByName { get; set; } = string.Empty;
    public DateTime AdjustedAt { get; set; }
}
