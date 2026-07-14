namespace DMS_Backend.Models.DTOs.ImmediateOrders;

public sealed class UpdateImmediateOrderDto
{
    public required string OrderBillNo { get; set; }

    public required DateTime OrderDate { get; set; }

    public required DateTime NeedByDate { get; set; }

    public required string NeedByTime { get; set; }

    public required DateTime DeliveryDate { get; set; }
    public required string DeliveryTime { get; set; }

    public required DateTime ProductionStartingDate { get; set; }
    public required string ProductionStartingTime { get; set; }

    public required string RecipeRequestNumber { get; set; }

    public required Guid DeliveryTurnId { get; set; }
    public required Guid OutletId { get; set; }
    public required Guid ProductId { get; set; }
    public decimal FullQuantity { get; set; } = 0;
    public decimal MiniQuantity { get; set; } = 0;
    public required string RequestedBy { get; set; }
    public required string Reason { get; set; }
    public bool IsCustomized { get; set; } = false;
    public string? CustomizationNotes { get; set; }
}
