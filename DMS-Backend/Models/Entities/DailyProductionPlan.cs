using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Tracks production planning with workflow status.
/// Named DailyProductionPlan to avoid conflict with existing ProductionPlan entity.
/// </summary>
[Table("daily_production_plans")]
public class DailyProductionPlan : BaseEntity
{
    /// <summary>
    /// Unique plan number (auto-generated: PRJ#######).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("plan_no")]
    public string PlanNo { get; set; } = string.Empty;

    /// <summary>
    /// Date for which production is planned.
    /// </summary>
    [Required]
    [Column("plan_date")]
    public DateTime PlanDate { get; set; }

    /// <summary>
    /// Product to be produced.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Planned quantity for production.
    /// </summary>
    [Required]
    [Column("planned_qty", TypeName = "decimal(18,4)")]
    public decimal PlannedQty { get; set; }

    /// <summary>
    /// Priority level for production.
    /// </summary>
    [Required]
    [Column("priority")]
    public ProductionPriority Priority { get; set; } = ProductionPriority.Medium;

    /// <summary>
    /// Current status of production plan.
    /// </summary>
    [Required]
    [Column("status")]
    public DailyProductionPlanStatus Status { get; set; } = DailyProductionPlanStatus.Draft;

    /// <summary>
    /// External reference or identifier.
    /// </summary>
    [MaxLength(100)]
    [Column("reference")]
    public string? Reference { get; set; }

    /// <summary>
    /// Comment for the plan.
    /// </summary>
    [Column("comment")]
    public string? Comment { get; set; }

    /// <summary>
    /// Additional notes.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this plan.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when plan was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public User? ApprovedBy { get; set; }
}

/// <summary>
/// Priority level for production planning.
/// </summary>
public enum ProductionPriority
{
    Low,
    Medium,
    High
}

/// <summary>
/// Status values for daily production plan documents.
/// </summary>
public enum DailyProductionPlanStatus
{
    Draft = 0,
    Approved = 1,
    InProgress = 2,
    Completed = 3,
    /// <summary>Submitted by creator; appears on central approvals until approved.</summary>
    PendingApproval = 4,
    Pending = 5,
}
