using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a bakery product delivery to showrooms with approval workflow.
/// </summary>
[Table("deliveries")]
public class Delivery : BaseEntity
{
    /// <summary>
    /// Unique delivery number (auto-generated: DN-YYYY-XXXXXX).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("delivery_no")]
    public string DeliveryNo { get; set; } = string.Empty;

    /// <summary>
    /// The date of delivery.
    /// </summary>
    [Required]
    [Column("delivery_date")]
    public DateTime DeliveryDate { get; set; }

    /// <summary>
    /// The outlet (showroom) receiving the delivery.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Current status of the delivery.
    /// </summary>
    [Required]
    [Column("status")]
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Draft;

    /// <summary>
    /// Total number of items in this delivery.
    /// </summary>
    [Column("total_items")]
    public int TotalItems { get; set; }

    /// <summary>
    /// Total value of the delivery.
    /// </summary>
    [Column("total_value", TypeName = "decimal(18,4)")]
    public decimal TotalValue { get; set; }

    /// <summary>
    /// Additional notes or comments.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved this delivery.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when delivery was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<DeliveryItem> Items { get; set; } = new List<DeliveryItem>();
}

/// <summary>
/// Line item for a delivery.
/// </summary>
[Table("delivery_items")]
public class DeliveryItem : BaseEntity
{
    /// <summary>
    /// Reference to the parent delivery.
    /// </summary>
    [Required]
    [Column("delivery_id")]
    public Guid DeliveryId { get; set; }

    /// <summary>
    /// Product being delivered.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity delivered.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// Unit price at time of delivery.
    /// </summary>
    [Required]
    [Column("unit_price", TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Total value (Quantity * UnitPrice).
    /// </summary>
    [Required]
    [Column("total", TypeName = "decimal(18,4)")]
    public decimal Total { get; set; }

    // Navigation properties
    public Delivery Delivery { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

/// <summary>
/// Status values for delivery documents.
/// </summary>
public enum DeliveryStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
