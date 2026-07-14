namespace DMS_Backend.Models.DTOs.ProductWeightVariants;

public class ProductWeightVariantDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal WeightGrams { get; set; }
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductWeightVariantDto
{
    public Guid ProductId { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal WeightGrams { get; set; }
    public bool IsDefault { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}

public class UpdateProductWeightVariantDto
{
    public string? Label { get; set; }
    public decimal? WeightGrams { get; set; }
    public bool? IsDefault { get; set; }
    public int? SortOrder { get; set; }
}
