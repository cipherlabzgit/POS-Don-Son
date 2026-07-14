namespace DMS_Backend.Models.DTOs.ImmediateOrders;

public sealed class ImmediateOrderListDto
{
    public Guid Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public string? OrderBillNo { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? NeedByDate { get; set; }
    public string? NeedByTime { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? DeliveryTime { get; set; }
    public DateTime? ProductionStartingDate { get; set; }
    public string? ProductionStartingTime { get; set; }
    public string? RecipeRequestNumber { get; set; }
    public Guid DeliveryTurnId { get; set; }
    public string DeliveryTurnName { get; set; } = string.Empty;
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsCustomized { get; set; }
    public DateTime CreatedAt { get; set; }
}
