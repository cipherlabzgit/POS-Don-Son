namespace DMS_Backend.Models.DTOs.Orders;

public sealed class BulkUpsertOrderItemDto
{
    public Guid? Id { get; set; }
    public required Guid ProductId { get; set; }
    public required Guid OutletId { get; set; }
    public required Guid DeliveryTurnId { get; set; }
    public decimal FullQuantity { get; set; } = 0;
    public decimal MiniQuantity { get; set; } = 0;
    public bool IsExtra { get; set; } = false;
    public bool IsCustomized { get; set; } = false;
    public string? CustomizationNotes { get; set; }
    public string? Notes { get; set; }
}
