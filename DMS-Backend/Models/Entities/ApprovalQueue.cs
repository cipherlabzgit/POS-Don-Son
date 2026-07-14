using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Generic approval queue for various document types requiring approval.
/// Used for stock adjustments, cancellations, and other approval workflows.
/// </summary>
[Table("approval_queue")]
public class ApprovalQueue : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("approval_type")]
    public string ApprovalType { get; set; } = string.Empty; // StockAdjustment, Cancellation, PriceChange, etc.

    [Required]
    [Column("entity_id")]
    public Guid EntityId { get; set; }

    [MaxLength(200)]
    [Column("entity_reference")]
    public string? EntityReference { get; set; }

    [Required]
    [Column("requested_by_id")]
    public Guid RequestedById { get; set; }

    [Required]
    [Column("requested_at")]
    public DateTime RequestedAt { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [Column("rejection_reason")]
    public string? RejectionReason { get; set; }

    [Column("request_data", TypeName = "jsonb")]
    public string? RequestData { get; set; }

    [Column("priority")]
    public int Priority { get; set; } = 0;

    [MaxLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("RequestedById")]
    public virtual User RequestedBy { get; set; } = null!;

    [ForeignKey("ApprovedById")]
    public virtual User? ApprovedBy { get; set; }
}
