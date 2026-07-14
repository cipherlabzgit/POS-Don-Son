using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipe_templates")]
public class RecipeTemplate : BaseEntity
{
    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }

    public bool IsDefault { get; set; }

    public int SortOrder { get; set; }

    // Navigation
    public virtual ICollection<RecipeTemplateComponent> RecipeTemplateComponents { get; set; } = new List<RecipeTemplateComponent>();
}
