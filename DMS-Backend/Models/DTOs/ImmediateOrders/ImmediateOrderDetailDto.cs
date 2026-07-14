namespace DMS_Backend.Models.DTOs.ImmediateOrders;

public sealed class ImmediateOrderDetailDto
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
    public string Reason { get; set; } = string.Empty;
    public bool IsCustomized { get; set; }
    public string? CustomizationNotes { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}
