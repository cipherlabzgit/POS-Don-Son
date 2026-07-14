namespace DMS_Backend.Models.DTOs.Deliveries;

public sealed class UpdateDeliveryDto
{
    public required DateTime DeliveryDate { get; set; }
    public required Guid OutletId { get; set; }
    public string? Notes { get; set; }
    public List<UpdateDeliveryItemDto> Items { get; set; } = new();
}

public sealed class UpdateDeliveryItemDto
{
    public Guid? Id { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
    public required decimal UnitPrice { get; set; }
}
