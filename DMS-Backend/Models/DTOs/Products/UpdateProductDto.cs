namespace DMS_Backend.Models.DTOs.Products;

public class UpdateProductDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public Guid CategoryId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    
    public decimal UnitPrice { get; set; }
    /// <summary>One of: RawMaterial, SemiFinished, Finished, Section</summary>
    public string ProductType { get; set; } = "Finished";
    public string? ProductionSection { get; set; }
    public Guid? ProductionSectionId { get; set; }

    /// <summary>Section assignments for many-to-many relationship.</summary>
    public List<UpsertProductSectionAssignmentDto> SectionAssignments { get; set; } = new();

    public bool HasFullSize { get; set; }
    public bool HasMiniSize { get; set; }
    
    public bool AllowDecimal { get; set; }
    public int DecimalPlaces { get; set; }
    public int RoundingValue { get; set; }
    public decimal? WeightGrams { get; set; }
    public decimal? StandardQuantity { get; set; }
    
    public bool IsPlainRollItem { get; set; }
    public bool RequireOpenStock { get; set; }
    
    public bool DisplayInPOS { get; set; }
    
    public bool EnableLabelPrint { get; set; }
    public bool AllowFutureLabelPrint { get; set; }
    public string LabelExpiryMode { get; set; } = "Days";
    public int? ExpiryDays { get; set; }
    public int? ExpiryHours { get; set; }
    public string? ExpiryFixedTime { get; set; }
    public Guid? LabelPrintUomId { get; set; }
    public int LabelPrintQty { get; set; } = 1;
    public int FutureManufactureDays { get; set; }
    public List<UpsertProductLabelIngredientDto> LabelIngredients { get; set; } = new();
    public Guid? LabelTemplateId { get; set; }
    
    public int SortOrder { get; set; }
    public List<int>? DefaultDeliveryTurns { get; set; }
    public List<int>? AvailableInTurns { get; set; }
    
    public bool IsActive { get; set; }
}
