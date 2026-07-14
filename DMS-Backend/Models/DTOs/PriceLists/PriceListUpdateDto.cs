namespace DMS_Backend.Models.DTOs.PriceLists;

public class PriceListUpdateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PriceListType { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsDefault { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
}
