using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Tracks daily production activities with approval workflow.
/// </summary>
[Table("daily_productions")]
public class DailyProduction : BaseEntity
{
    /// <summary>
    /// Unique production number (auto-generated: PRO#######).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("production_no")]
    public string ProductionNo { get; set; } = string.Empty;

    /// <summary>
    /// Date of production.
    /// </summary>
    [Required]
    [Column("production_date")]
    public DateTime ProductionDate { get; set; }

    /// <summary>
    /// Product being produced.
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
    /// Actual quantity produced.
    /// </summary>
    [Required]
    [Column("produced_qty", TypeName = "decimal(18,4)")]
    public decimal ProducedQty { get; set; }

    /// <summary>
    /// Production shift ID (references Shift table).
    /// </summary>
    [Required]
    [Column("shift_id")]
    public Guid ShiftId { get; set; }

    /// <summary>
    /// Current status of production.
    /// </summary>
    [Required]
    [Column("status")]
    public DailyProductionStatus Status { get; set; } = DailyProductionStatus.Draft;

    /// <summary>
    /// Additional notes or comments.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this production.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when production was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// Production section where this item was produced. Used to update FreezerStock.
    /// </summary>
    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    /// <summary>
    /// Groups multiple product lines submitted together in one form as a single batch.
    /// Null for records created before batching was introduced.
    /// </summary>
    [Column("batch_id")]
    public Guid? BatchId { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
    public ProductionSection ProductionSection { get; set; } = null!;
    public User? ApprovedBy { get; set; }
}

/// <summary>
/// Status values for daily production documents.
/// </summary>
public enum DailyProductionStatus
{
    Pending,
    Approved,
    Rejected,
    /// <summary>Editable by creator; use submit to queue for approval.</summary>
    Draft,
}
