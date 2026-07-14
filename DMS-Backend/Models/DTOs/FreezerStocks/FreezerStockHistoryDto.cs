namespace DMS_Backend.Models.DTOs.FreezerStocks;

public sealed class FreezerStockHistoryDto
{
    public Guid Id { get; set; }
    public Guid FreezerStockId { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal PreviousStock { get; set; }
    public decimal NewStock { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ReferenceNo { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedById { get; set; }
}
