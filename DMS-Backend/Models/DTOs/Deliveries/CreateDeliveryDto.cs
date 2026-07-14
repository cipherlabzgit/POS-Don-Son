namespace DMS_Backend.Models.DTOs.Deliveries;

public sealed class CreateDeliveryDto
{
    public required DateTime DeliveryDate { get; set; }
    public required Guid OutletId { get; set; }
    public string? Notes { get; set; }
    public List<CreateDeliveryItemDto> Items { get; set; } = new();
}

public sealed class CreateDeliveryItemDto
{
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
    public required decimal UnitPrice { get; set; }
}
