using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ProductionPlanListDto
{
    public Guid Id { get; set; }
    public Guid DeliveryPlanId { get; set; }
    public string DeliveryPlanName { get; set; } = string.Empty;
    public DateTime ComputedDate { get; set; }
    public ProductionPlanStatus Status { get; set; }
    public bool UseFreezerStock { get; set; }
    public int TotalProducts { get; set; }
    public decimal TotalQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
}
