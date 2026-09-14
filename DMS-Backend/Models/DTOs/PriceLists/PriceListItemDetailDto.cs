namespace DMS_Backend.Models.DTOs.PriceLists;

public class PriceListItemDetailDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal PreviousPrice { get; set; }
    public decimal NewPrice { get; set; }
}
