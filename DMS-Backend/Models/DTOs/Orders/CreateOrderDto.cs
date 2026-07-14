namespace DMS_Backend.Models.DTOs.Orders;

public sealed class CreateOrderDto
{
    public required string OrderNo { get; set; }
    public required DateTime OrderDate { get; set; }
    public required DateTime DeliveryDate { get; set; }
    public required string DeliveryTime { get; set; }
    public required DateTime ProductionStartingDate { get; set; }
    public required string ProductionStartingTime { get; set; }
    public string? RecipeRequestNumber { get; set; }
    public Guid? DeliveryPlanId { get; set; }
    public bool UseFreezerStock { get; set; } = false;
    public string? Notes { get; set; }
}
