namespace DMS_Backend.Models.DTOs.StockBF;

public sealed class UpdateStockBFDto
{
    public required DateTime BFDate { get; set; }
    public required Guid OutletId { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
}
