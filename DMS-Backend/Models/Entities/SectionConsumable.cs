using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents consumable items (like oil, salt, water) used by a production section.
/// These are not in recipes but added to stores issue notes as section consumables.
/// </summary>
[Table("section_consumables")]
public class SectionConsumable : BaseEntity
{
    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    [Required]
    [Column("ingredient_id")]
    public Guid IngredientId { get; set; }

    /// <summary>
    /// Default quantity consumed per day (or per batch).
    /// </summary>
    [Column("default_quantity", TypeName = "decimal(18,3)")]
    public decimal DefaultQuantity { get; set; }

    /// <summary>
    /// Whether quantity is calculated based on production volume.
    /// </summary>
    [Column("is_calculated")]
    public bool IsCalculated { get; set; } = false;

    /// <summary>
    /// Calculation formula (e.g., "production_weight * 0.02" for 2% of weight).
    /// </summary>
    [MaxLength(500)]
    [Column("calculation_formula")]
    public string? CalculationFormula { get; set; }

    /// <summary>
    /// Display order in stores issue note.
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Notes about usage or handling.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("ProductionSectionId")]
    public virtual ProductionSection ProductionSection { get; set; } = null!;

    [ForeignKey("IngredientId")]
    public virtual Ingredient Ingredient { get; set; } = null!;

    public string? Formula => CalculationFormula;
}
