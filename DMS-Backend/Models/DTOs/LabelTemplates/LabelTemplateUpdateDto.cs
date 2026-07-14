namespace DMS_Backend.Models.DTOs.LabelTemplates;

public class LabelTemplateUpdateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TemplateType { get; set; }
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public string? LayoutDesign { get; set; }
    public string? Fields { get; set; }
    public string? FontSettings { get; set; }
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public Guid? LabelPrinterId { get; set; }
}
