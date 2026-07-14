using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("recipes")]
public class Recipe : BaseEntity
{
    [Required]
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? TemplateId { get; set; }
    public RecipeTemplate? Template { get; set; }

    [MaxLength(200)]
    public string? RecipeName { get; set; }

    [MaxLength(50)]
    public string? Variant { get; set; }

    public int Version { get; set; } = 1;

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public bool ApplyRoundOff { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? RoundOffValue { get; set; }

    [MaxLength(500)]
    public string? RoundOffNotes { get; set; }

    // Navigation
    public ICollection<RecipeComponent> RecipeComponents { get; set; } = new List<RecipeComponent>();
}
