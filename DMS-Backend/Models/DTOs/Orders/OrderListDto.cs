namespace DMS_Backend.Models.DTOs.Orders;

public sealed class OrderListDto
{
    public Guid Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime DeliveryDate { get; set; }
    public string DeliveryTime { get; set; } = string.Empty;
    public DateTime ProductionStartingDate { get; set; }
    public string ProductionStartingTime { get; set; } = string.Empty;
    public string? RecipeRequestNumber { get; set; }
    public Guid? DeliveryPlanId { get; set; }
    public string? DeliveryPlanNo { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool UseFreezerStock { get; set; }
    public int TotalItems { get; set; }
    public DateTime UpdatedAt { get; set; }
    /// <summary>True when the order is not tied to a delivery plan (off-plan / custom showroom order).</summary>
    public bool IsCustomOrder { get; set; }
}
