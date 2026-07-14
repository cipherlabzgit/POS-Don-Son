using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Tracks stock adjustments with approval workflow and ApprovalQueue integration.
/// </summary>
[Table("stock_adjustments")]
public class StockAdjustment : BaseEntity
{
    /// <summary>
    /// Unique adjustment number (auto-generated: PSA#######).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("adjustment_no")]
    public string AdjustmentNo { get; set; } = string.Empty;

    /// <summary>
    /// Date of adjustment.
    /// </summary>
    [Required]
    [Column("adjustment_date")]
    public DateTime AdjustmentDate { get; set; }

    /// <summary>
    /// Product being adjusted.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Type of adjustment (Increase/Decrease).
    /// </summary>
    [Required]
    [Column("adjustment_type")]
    public StockAdjustmentType AdjustmentType { get; set; }

    /// <summary>
    /// Quantity to adjust.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// Reason for adjustment.
    /// </summary>
    [Required]
    [MaxLength(500)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Current status of adjustment.
    /// </summary>
    [Required]
    [Column("status")]
    public StockAdjustmentStatus Status { get; set; } = StockAdjustmentStatus.Draft;

    /// <summary>
    /// Additional notes or comments.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this adjustment.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when adjustment was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// Production section for this adjustment. Used to update FreezerStock.
    /// </summary>
    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public ProductionSection ProductionSection { get; set; } = null!;
    public User? ApprovedBy { get; set; }
}

/// <summary>
/// Type of stock adjustment.
/// </summary>
public enum StockAdjustmentType
{
    Increase,
    Decrease
}

/// <summary>
/// Status values for stock adjustment documents.
/// </summary>
public enum StockAdjustmentStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
