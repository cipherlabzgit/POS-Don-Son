using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipe_template_components")]
public class RecipeTemplateComponent : BaseEntity
{
    [Required]
    [Column("recipe_template_id")]
    public Guid RecipeTemplateId { get; set; }

    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("component_name")]
    public string ComponentName { get; set; } = string.Empty;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual RecipeTemplate? RecipeTemplate { get; set; }
    public virtual ProductionSection? ProductionSection { get; set; }
    public virtual ICollection<RecipeTemplateIngredient> RecipeTemplateIngredients { get; set; } = new List<RecipeTemplateIngredient>();
}
