namespace DMS_Backend.Models.DTOs.LabelPrinters;

public sealed class LabelPrinterCreateDto
{
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
