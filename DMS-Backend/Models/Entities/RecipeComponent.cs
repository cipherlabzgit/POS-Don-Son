using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipe_components")]
public class RecipeComponent : BaseEntity
{
    [Required]
    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    [Required]
    public Guid ProductionSectionId { get; set; }
    public ProductionSection ProductionSection { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string ComponentName { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    // Percentage-based recipe support
    public bool IsPercentageBased { get; set; }

    public Guid? BaseRecipeId { get; set; }
    public Recipe? BaseRecipe { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? PercentageOfBase { get; set; }

    // Navigation
    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}
