using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents showroom label print requests.
/// </summary>
[Table("showroom_label_requests")]
public class ShowroomLabelRequest : BaseEntity
{
    /// <summary>
    /// Human-readable display number (e.g., SLR-0001).
    /// </summary>
    [MaxLength(20)]
    [Column("display_no")]
    public string DisplayNo { get; set; } = string.Empty;

    /// <summary>
    /// The outlet/showroom for which labels are being printed.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Text line 1 to print on label (typically showroom code).
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("text_1")]
    public string Text1 { get; set; } = string.Empty;

    /// <summary>
    /// Text line 2 to print on label (custom text).
    /// </summary>
    [MaxLength(100)]
    [Column("text_2")]
    public string? Text2 { get; set; }

    /// <summary>
    /// Number of labels to print.
    /// </summary>
    [Required]
    [Column("label_count")]
    public int LabelCount { get; set; }

    /// <summary>
    /// Date of the print request.
    /// </summary>
    [Required]
    [Column("request_date")]
    public DateTime RequestDate { get; set; }

    /// <summary>
    /// Approval status: Pending, Approved, Rejected.
    /// </summary>
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// User who approved the request.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date when the request was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// User who rejected the request.
    /// </summary>
    [Column("rejected_by_id")]
    public Guid? RejectedById { get; set; }

    /// <summary>
    /// Date when the request was rejected.
    /// </summary>
    [Column("rejected_date")]
    public DateTime? RejectedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public User? RejectedBy { get; set; }
}
