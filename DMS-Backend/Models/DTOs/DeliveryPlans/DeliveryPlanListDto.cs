namespace DMS_Backend.Models.DTOs.DeliveryPlans;

public sealed class DeliveryPlanListDto
{
    public Guid Id { get; set; }
    public string PlanNo { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public Guid DeliveryTurnId { get; set; }
    public string DeliveryTurnName { get; set; } = string.Empty;
    public Guid DayTypeId { get; set; }
    public string DayTypeName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool UseFreezerStock { get; set; }
    public int TotalItems { get; set; }
    public DateTime UpdatedAt { get; set; }
}
