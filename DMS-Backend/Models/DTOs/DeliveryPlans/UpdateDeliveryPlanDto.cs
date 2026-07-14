namespace DMS_Backend.Models.DTOs.DeliveryPlans;

public sealed class UpdateDeliveryPlanDto
{
    public required DateTime PlanDate { get; set; }
    public required Guid DeliveryTurnId { get; set; }
    public required Guid DayTypeId { get; set; }
    public bool UseFreezerStock { get; set; } = false;
    public List<Guid>? ExcludedOutlets { get; set; }
    public List<Guid>? ExcludedProducts { get; set; }
    public string? Notes { get; set; }
    public Guid? RecipePlanId { get; set; }
}
