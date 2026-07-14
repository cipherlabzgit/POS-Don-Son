using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents default quantities per outlet, day type, and product matrix.
/// Used to pre-populate order quantities based on the type of day and outlet.
/// </summary>
[Table("default_quantities")]
public class DefaultQuantity : BaseEntity
{
    /// <summary>
    /// The outlet this default quantity applies to.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// The day type this default quantity applies to (Weekday, Saturday, etc.).
    /// </summary>
    [Required]
    [Column("day_type_id")]
    public Guid DayTypeId { get; set; }

    /// <summary>
    /// The product this default quantity is for.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Default quantity for full-sized products.
    /// </summary>
    [Column("full_quantity", TypeName = "decimal(18,4)")]
    public decimal FullQuantity { get; set; } = 0;

    /// <summary>
    /// Default quantity for mini-sized products.
    /// </summary>
    [Column("mini_quantity", TypeName = "decimal(18,4)")]
    public decimal MiniQuantity { get; set; } = 0;

    // Navigation properties
    public Outlet? Outlet { get; set; }
    public DayType? DayType { get; set; }
    public Product? Product { get; set; }
}
