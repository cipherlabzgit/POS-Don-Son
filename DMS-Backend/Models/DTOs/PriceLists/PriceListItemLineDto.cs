namespace DMS_Backend.Models.DTOs.PriceLists;

public class PriceListItemLineDto
{
    public Guid ProductId { get; set; }
    public decimal UnitPrice { get; set; }
}
