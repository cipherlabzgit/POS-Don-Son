using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Rounding rules for calculations and pricing.
/// </summary>
[Table("rounding_rules")]
public class RoundingRule : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Where this rule applies (e.g., "Price", "Quantity", "Weight")
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("applies_to")]
    public string AppliesTo { get; set; } = string.Empty;

    /// <summary>
    /// Rounding method (Up, Down, Nearest, HalfUp, HalfDown)
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("rounding_method")]
    public string RoundingMethod { get; set; } = "Nearest";

    /// <summary>
    /// Number of decimal places to round to
    /// </summary>
    [Column("decimal_places")]
    public int DecimalPlaces { get; set; } = 2;

    /// <summary>
    /// Rounding increment (e.g., 0.05 for rounding to nearest nickel)
    /// </summary>
    [Column("rounding_increment", TypeName = "decimal(10,4)")]
    public decimal RoundingIncrement { get; set; } = 1;

    /// <summary>
    /// Minimum value threshold
    /// </summary>
    [Column("min_value", TypeName = "decimal(18,4)")]
    public decimal? MinValue { get; set; }

    /// <summary>
    /// Maximum value threshold
    /// </summary>
    [Column("max_value", TypeName = "decimal(18,4)")]
    public decimal? MaxValue { get; set; }

    /// <summary>
    /// Item-level ratio denominator (e.g. 4 patties).
    /// </summary>
    [Column("ratio_base_quantity", TypeName = "decimal(18,6)")]
    public decimal? RatioBaseQuantity { get; set; }

    /// <summary>
    /// Item-level ratio numerator for the dependent quantity (e.g. 1 egg).
    /// </summary>
    [Column("ratio_yield_quantity", TypeName = "decimal(18,6)")]
    public decimal? RatioYieldQuantity { get; set; }

    /// <summary>
    /// Display order
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; }

    /// <summary>
    /// Is default rule for its category
    /// </summary>
    [Column("is_default")]
    public bool IsDefault { get; set; }
}
