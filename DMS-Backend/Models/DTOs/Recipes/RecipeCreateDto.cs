namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeCreateDto
{
    public Guid ProductId { get; set; }
    public string? RecipeName { get; set; }
    public string? Variant { get; set; }
    public Guid? TemplateId { get; set; }
    public int Version { get; set; } = 1;
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool ApplyRoundOff { get; set; }
    public decimal? RoundOffValue { get; set; }
    public string? RoundOffNotes { get; set; }
    public bool IsActive { get; set; } = true;
    public List<RecipeComponentDto> RecipeComponents { get; set; } = new();
}
