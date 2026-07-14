namespace DMS_Backend.Models.DTOs.ImmediateOrders;

public sealed class CreateImmediateOrderDto
{
    /// <summary>Showroom / POS bill reference (required on Anytime Order Request).</summary>
    public required string OrderBillNo { get; set; }

    public required DateTime OrderDate { get; set; }

    /// <summary>Date by which the customer needs the order.</summary>
    public required DateTime NeedByDate { get; set; }

    /// <summary>Time by which the customer needs the order.</summary>
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
