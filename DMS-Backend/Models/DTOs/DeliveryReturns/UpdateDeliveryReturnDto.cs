namespace DMS_Backend.Models.DTOs.DeliveryReturns;

public sealed class UpdateDeliveryReturnDto
{
    public required DateTime ReturnDate { get; set; }
    public required string DeliveryNo { get; set; }
    public required DateTime DeliveredDate { get; set; }
    public required Guid OutletId { get; set; }
    public required string Reason { get; set; }
    public List<UpdateDeliveryReturnItemDto> Items { get; set; } = new();
}

public sealed class UpdateDeliveryReturnItemDto
{
    public Guid? Id { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
}
