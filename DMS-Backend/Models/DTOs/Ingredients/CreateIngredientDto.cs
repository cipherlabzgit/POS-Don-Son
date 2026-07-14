namespace DMS_Backend.Models.DTOs.Ingredients;

public class CreateIngredientDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public string IngredientType { get; set; } = "Raw";
    public bool IsSemiFinishedItem { get; set; }
    public bool ExtraPercentageApplicable { get; set; }
    public decimal ExtraPercentage { get; set; }
    public bool AllowExtraQty { get; set; }
    public string? ExtraQtyNote { get; set; }
    public bool AllowDecimal { get; set; }
    public int DecimalPlaces { get; set; } = 2;
    public decimal UnitPrice { get; set; }
    public int SortOrder { get; set; }
    public decimal? ReorderThreshold { get; set; }
    public bool LowStockAlertEnabled { get; set; } = false;
    public decimal? LowStockThreshold { get; set; }
    public bool IsActive { get; set; } = true;
}
