using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents label printing requests for products with approval workflow.
/// </summary>
[Table("label_print_requests")]
public class LabelPrintRequest : BaseEntity
{
    /// <summary>
    /// Unique display number (auto-generated: LBL########).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("display_no")]
    public string DisplayNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of label print request.
    /// </summary>
    [Required]
    [Column("date")]
    public DateTime Date { get; set; }

    /// <summary>
    /// Product for which labels are being printed.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Number of labels to print.
    /// </summary>
    [Required]
    [Column("label_count")]
    public int LabelCount { get; set; }

    /// <summary>
    /// Start date to be printed on labels.
    /// </summary>
    [Required]
    [Column("start_date")]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Number of days until expiry from start date.
    /// </summary>
    [Required]
    [Column("expiry_days")]
    public int ExpiryDays { get; set; }

    /// <summary>
    /// Optional price override for the label (if different from product price).
    /// </summary>
    [Column("price_override", TypeName = "decimal(18,4)")]
    public decimal? PriceOverride { get; set; }

    /// <summary>
    /// Current status of the print request.
    /// </summary>
    [Required]
    [Column("status")]
    public LabelPrintStatus Status { get; set; } = LabelPrintStatus.Draft;

    /// <summary>
    /// User who approved this print request.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when print request was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public User? ApprovedBy { get; set; }
}

/// <summary>
/// Status values for label print requests.
/// </summary>
public enum LabelPrintStatus
{
    Pending,
    Approved,
    Rejected,
    /// <summary>Editable by creator; use submit to queue for approval.</summary>
    Draft,
}
