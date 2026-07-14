namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeDetailDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? RecipeName { get; set; }
    public string? Variant { get; set; }
    public Guid? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public int Version { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool ApplyRoundOff { get; set; }
    public decimal? RoundOffValue { get; set; }
    public string? RoundOffNotes { get; set; }
    public bool IsActive { get; set; }
    public List<RecipeComponentDto> RecipeComponents { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
