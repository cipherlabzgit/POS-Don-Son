namespace DMS_Backend.Models.DTOs.StockAdjustments;

public sealed class StockAdjustmentListDto
{
    public Guid Id { get; set; }
    public string AdjustmentNo { get; set; } = string.Empty;
    public DateTime AdjustmentDate { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public string AdjustmentType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
}
