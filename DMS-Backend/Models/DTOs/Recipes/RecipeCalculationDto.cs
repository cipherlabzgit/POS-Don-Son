namespace DMS_Backend.Models.DTOs.Recipes;

public class RecipeCalculationDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public List<CalculatedIngredientDto> Ingredients { get; set; } = new();
}

public class CalculatedIngredientDto
{
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public string ComponentName { get; set; } = string.Empty;
    public decimal RequiredQuantity { get; set; }
    public decimal ExtraQuantity { get; set; }
    public decimal TotalQuantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool StoresOnly { get; set; }
    public bool ShowExtraInStores { get; set; }
}
