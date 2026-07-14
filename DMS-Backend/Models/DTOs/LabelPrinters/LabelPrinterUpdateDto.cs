namespace DMS_Backend.Models.DTOs.LabelPrinters;

public sealed class LabelPrinterUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
