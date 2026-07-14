namespace DMS_Backend.Models.DTOs.Deliveries;

public sealed class DeliveryListDto
{
    public Guid Id { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
}
