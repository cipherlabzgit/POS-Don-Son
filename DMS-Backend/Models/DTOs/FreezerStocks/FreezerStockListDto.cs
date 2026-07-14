namespace DMS_Backend.Models.DTOs.FreezerStocks;

public sealed class FreezerStockListDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public Guid LastUpdatedBy { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}
