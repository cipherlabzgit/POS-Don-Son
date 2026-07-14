namespace DMS_Backend.Models.DTOs.FreezerStocks;

public sealed class AdjustFreezerStockDto
{
    public required Guid ProductId { get; set; }
    public required Guid ProductionSectionId { get; set; }
    public required decimal Quantity { get; set; }
    public required string TransactionType { get; set; }
    public required string Reason { get; set; }
    public string? ReferenceNo { get; set; }
}
