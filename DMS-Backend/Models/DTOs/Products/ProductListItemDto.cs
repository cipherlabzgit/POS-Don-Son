namespace DMS_Backend.Models.DTOs.Products;

public class ProductListItemDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid UnitOfMeasureId { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    /// <summary>One of: RawMaterial, SemiFinished, Finished, Section</summary>
    public string ProductType { get; set; } = "Finished";
    public string? ProductionSection { get; set; }
    public Guid? ProductionSectionId { get; set; }
    public List<ProductSectionAssignmentDto> SectionAssignments { get; set; } = new();
    public bool HasFullSize { get; set; } = true;
    public bool HasMiniSize { get; set; } = false;
    public bool AllowDecimal { get; set; } = false;
    public int DecimalPlaces { get; set; } = 2;
    public decimal RoundingValue { get; set; } = 0;
    public bool IsPlainRollItem { get; set; } = false;
    public int SortOrder { get; set; } = 0;
    public List<int> DefaultDeliveryTurns { get; set; } = new();
    public List<int> AvailableInTurns { get; set; } = new();
    public bool RequireOpenStock { get; set; }
    public bool DisplayInPOS { get; set; }
    public bool IsActive { get; set; }
    public bool EnableLabelPrint { get; set; }
    public bool AllowFutureLabelPrint { get; set; }
    public Guid? LabelTemplateId { get; set; }
}
