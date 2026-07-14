namespace DMS_Backend.Models.DTOs.DefaultQuantities;

public sealed class BulkUpsertDefaultQuantityDto
{
    public Guid? Id { get; set; }
    public required Guid OutletId { get; set; }
    public required Guid DayTypeId { get; set; }
    public required Guid ProductId { get; set; }
    public decimal FullQuantity { get; set; } = 0;
    public decimal MiniQuantity { get; set; } = 0;
}
