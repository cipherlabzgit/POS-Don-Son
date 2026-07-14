namespace DMS_Backend.Models.DTOs.DailyProductionPlans;

public sealed class DailyProductionPlanDetailDto
{
    public Guid Id { get; set; }
    public string PlanNo { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public decimal PlannedQty { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? Comment { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}
