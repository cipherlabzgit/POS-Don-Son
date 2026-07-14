using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Named recipe plan grouping multiple recipes for a specific operational period
/// (e.g., "Ramadan Plan", "Weekend Plan", "Seasonal Plan").
/// When a delivery plan uses a RecipePlan, the planner loads recipes from that plan
/// instead of the default active recipe for each product.
/// </summary>
[Table("recipe_plans")]
public class RecipePlan : BaseEntity
{
    [Required]
    [MaxLength(20)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    [Column("effective_from")]
    public DateTime? EffectiveFrom { get; set; }

    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual ICollection<RecipePlanItem> RecipePlanItems { get; set; } = new List<RecipePlanItem>();
}

/// <summary>
/// Links a specific Recipe version to a RecipePlan.
/// Allows overriding the default active recipe for a product under a named plan.
/// </summary>
[Table("recipe_plan_items")]
public class RecipePlanItem : BaseEntity
{
    [Required]
    [Column("recipe_plan_id")]
    public Guid RecipePlanId { get; set; }

    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Required]
    [Column("recipe_id")]
    public Guid RecipeId { get; set; }

    [MaxLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation
    public virtual RecipePlan? RecipePlan { get; set; }
    public virtual Product? Product { get; set; }
    public virtual Recipe? Recipe { get; set; }
}
