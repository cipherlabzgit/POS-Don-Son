namespace DMS_Backend.Models.DTOs.Products;

public class CreateProductDto
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
    
    public bool HasFullSize { get; set; } = true;
    public bool HasMiniSize { get; set; } = false;
    
    public bool AllowDecimal { get; set; } = false;
    public int DecimalPlaces { get; set; } = 0;
    public int RoundingValue { get; set; } = 1;
    public decimal? WeightGrams { get; set; }
    public decimal? StandardQuantity { get; set; }
    
    public bool IsPlainRollItem { get; set; } = false;
    public bool RequireOpenStock { get; set; } = true;
    
    public bool DisplayInPOS { get; set; } = true;
    
    public bool EnableLabelPrint { get; set; } = true;
    public bool AllowFutureLabelPrint { get; set; } = false;
    public string LabelExpiryMode { get; set; } = "Days";
    public int? ExpiryDays { get; set; }
    public int? ExpiryHours { get; set; }
    public string? ExpiryFixedTime { get; set; }
    public Guid? LabelPrintUomId { get; set; }
    public int LabelPrintQty { get; set; } = 1;
    public int FutureManufactureDays { get; set; }
    public List<UpsertProductLabelIngredientDto> LabelIngredients { get; set; } = new();
    public Guid? LabelTemplateId { get; set; }
    
    public int SortOrder { get; set; } = 0;
    public List<int>? DefaultDeliveryTurns { get; set; }
    public List<int>? AvailableInTurns { get; set; }
    
    public bool IsActive { get; set; } = true;
}
