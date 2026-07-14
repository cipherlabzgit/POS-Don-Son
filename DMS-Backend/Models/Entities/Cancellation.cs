using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents delivery cancellations with approval workflow.
/// </summary>
[Table("cancellations")]
public class Cancellation : BaseEntity
{
    /// <summary>
    /// Unique cancellation number (auto-generated: DCN########).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("cancellation_no")]
    public string CancellationNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of cancellation request.
    /// </summary>
    [Required]
    [Column("cancellation_date")]
    public DateTime CancellationDate { get; set; }

    /// <summary>
    /// Reference to the delivery number being cancelled.
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("delivery_no")]
    public string DeliveryNo { get; set; } = string.Empty;

    /// <summary>
    /// Original delivery date.
    /// </summary>
    [Required]
    [Column("delivered_date")]
    public DateTime DeliveredDate { get; set; }

    /// <summary>
    /// The outlet for this cancellation.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Reason for cancellation.
    /// </summary>
    [Required]
    [MaxLength(500)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the cancellation.
    /// </summary>
    [Required]
    [Column("status")]
    public CancellationStatus Status { get; set; } = CancellationStatus.Draft;

    /// <summary>
    /// User who approved this cancellation.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when cancellation was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
}

/// <summary>
/// Status values for cancellation requests.
/// </summary>
public enum CancellationStatus
{
    Pending,
    Approved,
    Rejected,
    /// <summary>Editable by creator; use submit to queue for approval.</summary>
    Draft,
}
