namespace DMS_Backend.Models.DTOs.ShowroomOpenStock;

public sealed class CreateShowroomOpenStockDto
{
    public required Guid OutletId { get; set; }
    public required DateTime StockAsAt { get; set; }
}
