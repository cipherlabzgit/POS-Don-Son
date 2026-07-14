namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeComponentDto
{
    public Guid? Id { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string? ProductionSectionName { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPercentageBased { get; set; }
    public Guid? BaseRecipeId { get; set; }
    public decimal? PercentageOfBase { get; set; }
    public List<RecipeIngredientDto> RecipeIngredients { get; set; } = new();
}
