using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Label template for product labels with customizable layout and fields.
/// </summary>
[Table("label_templates")]
public class LabelTemplate : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Template category (e.g., "Product", "Ingredient", "Box")
    /// </summary>
    [MaxLength(50)]
    [Column("template_type")]
    public string? TemplateType { get; set; }

    /// <summary>
    /// Width in millimeters
    /// </summary>
    [Column("width_mm")]
    public decimal WidthMm { get; set; }

    /// <summary>
    /// Height in millimeters
    /// </summary>
    [Column("height_mm")]
    public decimal HeightMm { get; set; }

    /// <summary>
    /// Layout design (JSON or HTML)
    /// </summary>
    [Column("layout_design", TypeName = "text")]
    public string? LayoutDesign { get; set; }

    /// <summary>
    /// Fields to include (JSON array)
    /// </summary>
    [Column("fields", TypeName = "jsonb")]
    public string? Fields { get; set; }

    /// <summary>
    /// Font settings (JSON)
    /// </summary>
    [Column("font_settings", TypeName = "jsonb")]
    public string? FontSettings { get; set; }

    /// <summary>
    /// Optional default printer for this template (Label Settings → Set template to printer).
    /// </summary>
    [Column("label_printer_id")]
    public Guid? LabelPrinterId { get; set; }

    /// <summary>
    /// Display order for selection dropdown
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; }

    /// <summary>
    /// Is default template for its type
    /// </summary>
    [Column("is_default")]
    public bool IsDefault { get; set; }

    public LabelPrinter? LabelPrinter { get; set; }
}
