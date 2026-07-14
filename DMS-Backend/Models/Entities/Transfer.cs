using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents product transfers between showrooms with approval workflow.
/// </summary>
[Table("transfers")]
public class Transfer : BaseEntity
{
    /// <summary>
    /// Unique transfer number (auto-generated: TR-YYYY-XXXXXX).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("transfer_no")]
    public string TransferNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of transfer.
    /// </summary>
    [Required]
    [Column("transfer_date")]
    public DateTime TransferDate { get; set; }

    /// <summary>
    /// The outlet transferring from (source).
    /// </summary>
    [Required]
    [Column("from_outlet_id")]
    public Guid FromOutletId { get; set; }

    /// <summary>
    /// The outlet transferring to (destination).
    /// </summary>
    [Required]
    [Column("to_outlet_id")]
    public Guid ToOutletId { get; set; }

    /// <summary>
    /// Current status of the transfer.
    /// </summary>
    [Required]
    [Column("status")]
    public TransferStatus Status { get; set; } = TransferStatus.Draft;

    /// <summary>
    /// Total number of items in this transfer.
    /// </summary>
    [Column("total_items")]
    public int TotalItems { get; set; }

    /// <summary>
    /// Additional notes or comments.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this transfer.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when transfer was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Outlet FromOutlet { get; set; } = null!;
    public Outlet ToOutlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<TransferItem> Items { get; set; } = new List<TransferItem>();
}

/// <summary>
/// Line item for a transfer.
/// </summary>
[Table("transfer_items")]
public class TransferItem : BaseEntity
{
    /// <summary>
    /// Reference to the parent transfer.
    /// </summary>
    [Required]
    [Column("transfer_id")]
    public Guid TransferId { get; set; }

    /// <summary>
    /// Product being transferred.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity transferred.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    // Navigation properties
    public Transfer Transfer { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

/// <summary>
/// Status values for transfer documents.
/// </summary>
public enum TransferStatus
{
    Draft,
    Pending,
    Approved,
    Rejected,
    Completed
}
