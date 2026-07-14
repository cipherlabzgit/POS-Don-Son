namespace DMS_Backend.Models.DTOs.Cancellations;

public sealed class UpdateCancellationDto
{
    public required DateTime CancellationDate { get; set; }
    public required string DeliveryNo { get; set; }
    public required DateTime DeliveredDate { get; set; }
    public required Guid OutletId { get; set; }
    public required string Reason { get; set; }
}
