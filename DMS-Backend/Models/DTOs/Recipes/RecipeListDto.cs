namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeListDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public int Version { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool ApplyRoundOff { get; set; }
    public bool IsActive { get; set; }
    public int ComponentCount { get; set; }
}
