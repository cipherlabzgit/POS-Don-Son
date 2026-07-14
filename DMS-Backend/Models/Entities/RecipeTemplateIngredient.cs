using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipe_template_ingredients")]
public class RecipeTemplateIngredient : BaseEntity
{
    [Required]
    [Column("recipe_template_component_id")]
    public Guid RecipeTemplateComponentId { get; set; }

    [Required]
    [Column("ingredient_id")]
    public Guid IngredientId { get; set; }

    [Column("qty_per_unit", TypeName = "decimal(18,4)")]
    public decimal QtyPerUnit { get; set; }

    [Column("extra_qty_per_unit", TypeName = "decimal(18,4)")]
    public decimal ExtraQtyPerUnit { get; set; }

    [Column("stores_only")]
    public bool StoresOnly { get; set; } = false;

    [Column("show_extra_in_stores")]
    public bool ShowExtraInStores { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual RecipeTemplateComponent? RecipeTemplateComponent { get; set; }
    public virtual Ingredient? Ingredient { get; set; }
}
