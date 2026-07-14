namespace DMS_Backend.Models.DTOs.CurrentStock;

/// <summary>
/// DTO for computed current stock view (not a stored entity).
/// Aggregates data from multiple tables to show current stock position.
/// </summary>
public sealed class CurrentStockDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal OpenBalance { get; set; }
    public decimal TodayProduction { get; set; }
    public decimal TodayProductionCancelled { get; set; }
    public decimal TodayDelivery { get; set; }
    public decimal DeliveryCancelled { get; set; }
    public decimal DeliveryReturned { get; set; }
    public decimal StockAdjustments { get; set; }
    public decimal TodayBalance { get; set; }
}
