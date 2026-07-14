namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeUpdateDto
{
    public Guid ProductId { get; set; }
    public string? RecipeName { get; set; }
    public string? Variant { get; set; }
    public Guid? TemplateId { get; set; }
    public int Version { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool ApplyRoundOff { get; set; }
    public decimal? RoundOffValue { get; set; }
    public string? RoundOffNotes { get; set; }
    public bool IsActive { get; set; }
    public List<RecipeComponentDto> RecipeComponents { get; set; } = new();
}
