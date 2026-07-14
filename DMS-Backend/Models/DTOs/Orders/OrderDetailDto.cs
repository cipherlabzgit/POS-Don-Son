namespace DMS_Backend.Models.DTOs.Orders;

public sealed class OrderDetailDto
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
    public string? Notes { get; set; }
    /// <summary>True when the order is not tied to a delivery plan (off-plan / custom showroom order).</summary>
    public bool IsCustomOrder { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}

public sealed class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid OrderHeaderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public Guid DeliveryTurnId { get; set; }
    public string DeliveryTurnName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
    public bool IsExtra { get; set; }
    public bool IsCustomized { get; set; }
    public string? CustomizationNotes { get; set; }
    public string? Notes { get; set; }
}
