namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeIngredientDto
{
    public Guid? Id { get; set; }
    public Guid IngredientId { get; set; }
    public string? IngredientCode { get; set; }
    public string? IngredientName { get; set; }
    public decimal QtyPerUnit { get; set; }
    public decimal ExtraQtyPerUnit { get; set; }
    public bool StoresOnly { get; set; }
    public bool ShowExtraInStores { get; set; }
    public bool IsPercentage { get; set; }
    public Guid? PercentageSourceProductId { get; set; }
    public decimal? PercentageValue { get; set; }
    public int SortOrder { get; set; }
}
