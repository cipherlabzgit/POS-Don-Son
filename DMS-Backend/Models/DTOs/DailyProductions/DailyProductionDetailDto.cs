namespace DMS_Backend.Models.DTOs.DailyProductions;

public sealed class DailyProductionDetailDto
{
    public Guid Id { get; set; }
    public string ProductionNo { get; set; } = string.Empty;
    public DateTime ProductionDate { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal PlannedQty { get; set; }
    public decimal ProducedQty { get; set; }
    public Guid ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? UpdatedById { get; set; }
    public string? UpdatedByName { get; set; }
}
