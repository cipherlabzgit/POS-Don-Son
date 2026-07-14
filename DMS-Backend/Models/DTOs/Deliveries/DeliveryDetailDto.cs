namespace DMS_Backend.Models.DTOs.Deliveries;

public sealed class DeliveryDetailDto
{
    public Guid Id { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public List<DeliveryItemDto> Items { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? UpdatedById { get; set; }
}

public sealed class DeliveryItemDto
{
    public Guid Id { get; set; }
    public Guid DeliveryId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}
