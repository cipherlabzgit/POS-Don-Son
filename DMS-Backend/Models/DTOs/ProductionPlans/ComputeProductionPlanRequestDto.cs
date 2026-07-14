namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ComputeProductionPlanRequestDto
{
    public Guid DeliveryPlanId { get; set; }
    public bool UseFreezerStock { get; set; }
}
