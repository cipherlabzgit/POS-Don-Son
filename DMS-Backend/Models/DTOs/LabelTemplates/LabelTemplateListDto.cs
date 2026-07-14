namespace DMS_Backend.Models.DTOs.LabelTemplates;

public class LabelTemplateListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TemplateType { get; set; }
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public Guid? LabelPrinterId { get; set; }
    public string? PrinterName { get; set; }
}
