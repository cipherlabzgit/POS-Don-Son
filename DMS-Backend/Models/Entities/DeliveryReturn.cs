using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents product returns from showrooms with approval workflow.
/// </summary>
[Table("delivery_returns")]
public class DeliveryReturn : BaseEntity
{
    /// <summary>
    /// Unique return number (auto-generated: RET########).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("return_no")]
    public string ReturnNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of return.
    /// </summary>
    [Required]
    [Column("return_date")]
    public DateTime ReturnDate { get; set; }

    /// <summary>
    /// Reference to the delivery number being returned.
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
    /// The outlet returning products.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Reason for return.
    /// </summary>
    [Required]
    [MaxLength(500)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Total number of items in this return.
    /// </summary>
    [Column("total_items")]
    public int TotalItems { get; set; }

    /// <summary>
    /// Current status of the return.
    /// </summary>
    [Required]
    [Column("status")]
    public DeliveryReturnStatus Status { get; set; } = DeliveryReturnStatus.Draft;

    /// <summary>
    /// User who approved this return.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when return was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<DeliveryReturnItem> Items { get; set; } = new List<DeliveryReturnItem>();
}

/// <summary>
/// Line item for a delivery return.
/// </summary>
[Table("delivery_return_items")]
public class DeliveryReturnItem : BaseEntity
{
    /// <summary>
    /// Reference to the parent delivery return.
    /// </summary>
    [Required]
    [Column("delivery_return_id")]
    public Guid DeliveryReturnId { get; set; }

    /// <summary>
    /// Product being returned.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity returned.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    // Navigation properties
    public DeliveryReturn DeliveryReturn { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

/// <summary>
/// Status values for delivery return documents.
/// </summary>
public enum DeliveryReturnStatus
{
    Draft,
    Pending,
    Approved,
    Processed
}
