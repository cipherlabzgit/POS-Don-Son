using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a line item in an order with quantities per product, outlet, and turn.
/// Supports decimal quantities (e.g., 4.75 patties), extra items, and customizations.
/// </summary>
[Table("order_items")]
public class OrderItem : BaseEntity
{
    /// <summary>
    /// The parent order this item belongs to.
    /// </summary>
    [Required]
    [Column("order_header_id")]
    public Guid OrderHeaderId { get; set; }

    /// <summary>
    /// The product for this line item.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// The outlet this item is for.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// The delivery turn this item is for (supports multi-turn orders).
    /// </summary>
    [Required]
    [Column("delivery_turn_id")]
    public Guid DeliveryTurnId { get; set; }

    /// <summary>
    /// Quantity of full-sized products (supports decimals like 4.75).
    /// </summary>
    [Column("full_quantity", TypeName = "decimal(18,4)")]
    public decimal FullQuantity { get; set; } = 0;

    /// <summary>
    /// Quantity of mini-sized products (supports decimals).
    /// </summary>
    [Column("mini_quantity", TypeName = "decimal(18,4)")]
    public decimal MiniQuantity { get; set; } = 0;

    /// <summary>
    /// Whether this is an extra item not tied to a specific outlet.
    /// </summary>
    [Column("is_extra")]
    public bool IsExtra { get; set; } = false;

    /// <summary>
    /// Whether this item has customizations.
    /// </summary>
    [Column("is_customized")]
    public bool IsCustomized { get; set; } = false;

    /// <summary>
    /// Customization notes for this item.
    /// </summary>
    [Column("customization_notes")]
    public string? CustomizationNotes { get; set; }

    /// <summary>
    /// Optional notes for this specific line item.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    public OrderHeader? OrderHeader { get; set; }
    public Product? Product { get; set; }
    public Outlet? Outlet { get; set; }
    public DeliveryTurn? DeliveryTurn { get; set; }
}
