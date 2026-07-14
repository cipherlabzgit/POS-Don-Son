using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a line item in a delivery plan with quantities per product and outlet.
/// </summary>
[Table("delivery_plan_items")]
public class DeliveryPlanItem : BaseEntity
{
    /// <summary>
    /// The parent delivery plan this item belongs to.
    /// </summary>
    [Required]
    [Column("delivery_plan_id")]
    public Guid DeliveryPlanId { get; set; }

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
    /// Quantity of full-sized products.
    /// </summary>
    [Column("full_quantity", TypeName = "decimal(18,4)")]
    public decimal FullQuantity { get; set; } = 0;

    /// <summary>
    /// Quantity of mini-sized products.
    /// </summary>
    [Column("mini_quantity", TypeName = "decimal(18,4)")]
    public decimal MiniQuantity { get; set; } = 0;

    /// <summary>
    /// Manually added extra quantity for production.
    /// </summary>
    [Column("extra_quantity", TypeName = "decimal(18,4)")]
    public decimal ExtraQuantity { get; set; } = 0;

    /// <summary>
    /// When true this item is excluded from the delivery (outlet closed, product not produced, etc).
    /// </summary>
    [Column("is_excluded")]
    public bool IsExcluded { get; set; } = false;

    /// <summary>
    /// Optional notes for this specific line item.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Optional weight variant selected for this delivery line.
    /// Links to ProductWeightVariant for products that have multiple weight options.
    /// </summary>
    [Column("weight_variant_id")]
    public Guid? WeightVariantId { get; set; }

    // Navigation properties
    public DeliveryPlan? DeliveryPlan { get; set; }
    public Product? Product { get; set; }
    public Outlet? Outlet { get; set; }
    public virtual ProductWeightVariant? WeightVariant { get; set; }
}
