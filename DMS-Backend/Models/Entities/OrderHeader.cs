using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents an order header with metadata and configuration.
/// Contains line items in OrderItem with multi-turn support.
/// </summary>
[Table("order_headers")]
public class OrderHeader : BaseEntity
{
    /// <summary>
    /// Unique order number (e.g., "ORD-2024-001").
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("order_no")]
    public string OrderNo { get; set; } = string.Empty;

    /// <summary>
    /// The date this order is placed.
    /// </summary>
    [Required]
    [Column("order_date")]
    public DateTime OrderDate { get; set; }

    /// <summary>
    /// Optional reference to a delivery plan this order is based on.
    /// </summary>
    [Column("delivery_plan_id")]
    public Guid? DeliveryPlanId { get; set; }

    /// <summary>
    /// Requested delivery date for custom showroom orders.
    /// </summary>
    [Required]
    [Column("delivery_date", TypeName = "date")]
    public DateTime DeliveryDate { get; set; }

    /// <summary>
    /// Requested delivery time for custom showroom orders.
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("delivery_time")]
    public string DeliveryTime { get; set; } = string.Empty;

    /// <summary>
    /// Requested production start date for custom showroom orders.
    /// </summary>
    [Required]
    [Column("production_start_date", TypeName = "date")]
    public DateTime ProductionStartingDate { get; set; }

    /// <summary>
    /// Requested production start time for custom showroom orders.
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("production_start_time")]
    public string ProductionStartingTime { get; set; } = string.Empty;

    /// <summary>
    /// Reference number for recipe request.
    /// </summary>
    [MaxLength(100)]
    [Column("recipe_request_number")]
    public string? RecipeRequestNumber { get; set; }

    /// <summary>
    /// Current status of the order.
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// Whether to use freezer stock for this order.
    /// </summary>
    [Column("use_freezer_stock")]
    public bool UseFreezerStock { get; set; } = false;

    /// <summary>
    /// Total number of items in this order.
    /// </summary>
    [Column("total_items")]
    public int TotalItems { get; set; } = 0;

    /// <summary>
    /// Additional notes or comments for the order.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    public DeliveryPlan? DeliveryPlan { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
