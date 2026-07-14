using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipe_ingredients")]
public class RecipeIngredient : BaseEntity
{
    [Required]
    public Guid RecipeComponentId { get; set; }
    public RecipeComponent RecipeComponent { get; set; } = null!;

    [Required]
    public Guid IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;

    [Column(TypeName = "decimal(18,4)")]
    public decimal QtyPerUnit { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ExtraQtyPerUnit { get; set; }

    public bool StoresOnly { get; set; }

    public bool ShowExtraInStores { get; set; }

    // Percentage-based
    public bool IsPercentage { get; set; }

    public Guid? PercentageSourceProductId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? PercentageValue { get; set; }

    public int SortOrder { get; set; }
}
