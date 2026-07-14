using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents disposal of bakery products at showrooms with approval workflow.
/// </summary>
[Table("disposals")]
public class Disposal : BaseEntity
{
    /// <summary>
    /// Unique disposal number (auto-generated: DS-YYYY-XXXXXX).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("disposal_no")]
    public string DisposalNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of disposal.
    /// </summary>
    [Required]
    [Column("disposal_date")]
    public DateTime DisposalDate { get; set; }

    /// <summary>
    /// The outlet (showroom) where disposal occurred.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Reference to original delivery date.
    /// </summary>
    [Required]
    [Column("delivered_date")]
    public DateTime DeliveredDate { get; set; }

    /// <summary>
    /// Current status of the disposal.
    /// </summary>
    [Required]
    [Column("status")]
    public DisposalStatus Status { get; set; } = DisposalStatus.Draft;

    /// <summary>
    /// Total number of items in this disposal.
    /// </summary>
    [Column("total_items")]
    public int TotalItems { get; set; }

    /// <summary>
    /// Additional notes or comments.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this disposal.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when disposal was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<DisposalItem> Items { get; set; } = new List<DisposalItem>();
}

/// <summary>
/// Line item for a disposal.
/// </summary>
[Table("disposal_items")]
public class DisposalItem : BaseEntity
{
    /// <summary>
    /// Reference to the parent disposal.
    /// </summary>
    [Required]
    [Column("disposal_id")]
    public Guid DisposalId { get; set; }

    /// <summary>
    /// Product being disposed.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity disposed.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// Reason for disposal.
    /// </summary>
    [Column("reason")]
    public string? Reason { get; set; }

    // Navigation properties
    public Disposal Disposal { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

/// <summary>
/// Status values for disposal documents.
/// </summary>
public enum DisposalStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
