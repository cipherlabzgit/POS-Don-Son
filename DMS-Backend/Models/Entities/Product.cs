using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Classifies a product in the production/inventory hierarchy.
/// </summary>
public enum ProductCategory
{
    /// <summary>Raw ingredients that are used in recipes (flour, sugar, eggs).</summary>
    RawMaterial,
    /// <summary>Partially processed products used as inputs in other recipes (dough, filling).</summary>
    SemiFinished,
    /// <summary>End products that are delivered to outlets (buns, rolls, pastries).</summary>
    Finished,
    /// <summary>A logical grouping of items produced within one production section (e.g., hotdog section).</summary>
    Section
}

public class Product : BaseEntity
{
    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    // Category relationship
    [Required]
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }

    // Unit of Measure relationship
    [Required]
    public Guid UnitOfMeasureId { get; set; }
    public UnitOfMeasure? UnitOfMeasure { get; set; }

    // Pricing
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    // Product type and section
    /// <summary>
    /// Classifies this product as RawMaterial, SemiFinished, Finished, or Section.
    /// Stored as a string in the database for readability.
    /// </summary>
    [MaxLength(50)]
    public string ProductType { get; set; } = nameof(ProductCategory.Finished);

    [MaxLength(100)]
    public string? ProductionSection { get; set; } // e.g., "Bakery 1", "Plain Roll Section", "Pastry Section"

    [Column("production_section_id")]
    public Guid? ProductionSectionId { get; set; }
    public virtual ProductionSection? ProductionSectionRef { get; set; }

    // Many-to-many: a product can span multiple production sections
    public virtual ICollection<ProductSectionAssignment> SectionAssignments { get; set; } = new List<ProductSectionAssignment>();

    // Variant flags
    public bool HasFullSize { get; set; } = true;
    public bool HasMiniSize { get; set; } = false;

    // Decimal handling
    public bool AllowDecimal { get; set; } = false;
    public int DecimalPlaces { get; set; } = 0;

    // Rounding
    public int RoundingValue { get; set; } = 1; // e.g., 5 for bakery, 1 for others

    [Column(TypeName = "decimal(18,4)")]
    public decimal? WeightGrams { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? StandardQuantity { get; set; }

    // Production flags
    public bool IsPlainRollItem { get; set; } = false;
    public bool RequireOpenStock { get; set; } = true;

    // POS Display
    /// <summary>
    /// Controls whether this product should be displayed in POS terminals.
    /// When false, product won't appear in POS catalog even if active.
    /// </summary>
    public bool DisplayInPOS { get; set; } = true;

    // Label printing
    public bool EnableLabelPrint { get; set; } = true;
    public bool AllowFutureLabelPrint { get; set; } = false;

    /// <summary>Days, Hours, or FixedTime.</summary>
    [MaxLength(20)]
    public string LabelExpiryMode { get; set; } = "Days";

    public int? ExpiryDays { get; set; }
    public int? ExpiryHours { get; set; }

    [MaxLength(30)]
    public string? ExpiryFixedTime { get; set; }

    public Guid? LabelPrintUomId { get; set; }
    public UnitOfMeasure? LabelPrintUom { get; set; }

    public int LabelPrintQty { get; set; } = 1;
    public int FutureManufactureDays { get; set; }

    public virtual ICollection<ProductLabelIngredient> LabelIngredients { get; set; } = new List<ProductLabelIngredient>();

    public Guid? LabelTemplateId { get; set; }
    public LabelTemplate? LabelTemplate { get; set; }

    // Display order
    public int SortOrder { get; set; } = 0;

    // Delivery turns (stored as JSON array of turn IDs)
    [Column(TypeName = "jsonb")]
    public List<int>? DefaultDeliveryTurns { get; set; }

    [Column(TypeName = "jsonb")]
    public List<int>? AvailableInTurns { get; set; }
}
