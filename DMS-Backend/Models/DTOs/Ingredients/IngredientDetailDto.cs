namespace DMS_Backend.Models.DTOs.Ingredients;

public class IngredientDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid UnitOfMeasureId { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public string IngredientType { get; set; } = string.Empty;
    public bool IsSemiFinishedItem { get; set; }
    public bool ExtraPercentageApplicable { get; set; }
    public decimal ExtraPercentage { get; set; }
    public bool AllowExtraQty { get; set; }
    public string? ExtraQtyNote { get; set; }
    public bool AllowDecimal { get; set; }
    public int DecimalPlaces { get; set; }
    public decimal UnitPrice { get; set; }
    public int SortOrder { get; set; }
    public decimal? ReorderThreshold { get; set; }
    public bool LowStockAlertEnabled { get; set; }
    public decimal? LowStockThreshold { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
