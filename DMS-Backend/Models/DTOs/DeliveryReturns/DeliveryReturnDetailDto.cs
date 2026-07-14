namespace DMS_Backend.Models.DTOs.DeliveryReturns;

public sealed class DeliveryReturnDetailDto
{
    public Guid Id { get; set; }
    public string ReturnNo { get; set; } = string.Empty;
    public DateTime ReturnDate { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public DateTime DeliveredDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string OutletCode { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public List<DeliveryReturnItemDto> Items { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}

public sealed class DeliveryReturnItemDto
{
    public Guid Id { get; set; }
    public Guid DeliveryReturnId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
}
