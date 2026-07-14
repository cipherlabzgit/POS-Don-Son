using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ProductionPlanDetailDto
{
    public Guid Id { get; set; }
    public Guid DeliveryPlanId { get; set; }
    public DateTime ComputedDate { get; set; }
    public ProductionPlanStatus Status { get; set; }
    public bool UseFreezerStock { get; set; }
    public int TotalProducts { get; set; }
    public decimal TotalQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ProductionPlanItemDto> Items { get; set; } = new();
}
