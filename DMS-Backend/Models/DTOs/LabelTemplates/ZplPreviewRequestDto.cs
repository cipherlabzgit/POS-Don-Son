namespace DMS_Backend.Models.DTOs.LabelTemplates;

public class ZplPreviewRequestDto
{
    public string Zpl { get; set; } = string.Empty;
    public decimal WidthMm { get; set; } = 100;
    public decimal HeightMm { get; set; } = 50;
    /// <summary>Dots per mm: 6, 8 (203dpi), 12 (300dpi), or 24 (600dpi)</summary>
    public int Dpmm { get; set; } = 8;
}
