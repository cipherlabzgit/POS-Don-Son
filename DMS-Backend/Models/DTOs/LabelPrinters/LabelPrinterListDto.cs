namespace DMS_Backend.Models.DTOs.LabelPrinters;

public sealed class LabelPrinterListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
