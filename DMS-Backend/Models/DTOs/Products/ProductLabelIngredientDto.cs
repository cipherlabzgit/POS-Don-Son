namespace DMS_Backend.Models.DTOs.Products;

public class ProductLabelIngredientDto
{
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class UpsertProductLabelIngredientDto
{
    public Guid IngredientId { get; set; }
    public int SortOrder { get; set; }
}
