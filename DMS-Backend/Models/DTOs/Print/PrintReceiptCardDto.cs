namespace DMS_Backend.Models.DTOs.Print;

public class PrintReceiptCardDto
{
    public Guid DeliveryPlanId { get; set; }
    public DateTime DeliveryDate { get; set; }
    public string TurnName { get; set; } = string.Empty;
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public string OutletAddress { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public List<ReceiptCardProductDto> Products { get; set; } = new();
    public decimal TotalQuantity { get; set; }
    public DateTime PrintedAt { get; set; } = DateTime.UtcNow;
}

public class ReceiptCardProductDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQty { get; set; }
    public decimal MiniQty { get; set; }
    public bool IsCustomized { get; set; }
    public string? CustomizationNotes { get; set; }
}
