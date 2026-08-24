namespace DMS_Backend.Models.DTOs.Products;

public class ProductDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    
    public Guid UnitOfMeasureId { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    
    public decimal UnitPrice { get; set; }
    /// <summary>One of: RawMaterial, SemiFinished, Finished, Section</summary>
    public string ProductType { get; set; } = "Finished";
    public string? ProductionSection { get; set; }
    public Guid? ProductionSectionId { get; set; }
    public string? ProductionSectionName { get; set; }

    /// <summary>All sections this product is assigned to (many-to-many).</summary>
    public List<ProductSectionAssignmentDto> SectionAssignments { get; set; } = new();
    
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
    public string? LabelPrintUom { get; set; }
    public int LabelPrintQty { get; set; }
    public int FutureManufactureDays { get; set; }
    public List<ProductLabelIngredientDto> LabelIngredients { get; set; } = new();
    public Guid? LabelTemplateId { get; set; }
    public string? LabelTemplateCode { get; set; }
    public string? LabelTemplateName { get; set; }
    
    public int SortOrder { get; set; }
    public List<int>? DefaultDeliveryTurns { get; set; }
    public List<int>? AvailableInTurns { get; set; }
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
