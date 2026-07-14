namespace DMS_Backend.Models.DTOs.Transfers;

public sealed class TransferDetailDto
{
    public Guid Id { get; set; }
    public string TransferNo { get; set; } = string.Empty;
    public DateTime TransferDate { get; set; }
    public Guid FromOutletId { get; set; }
    public string FromOutletName { get; set; } = string.Empty;
    public Guid ToOutletId { get; set; }
    public string ToOutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public List<TransferItemDto> Items { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? UpdatedById { get; set; }
}

public sealed class TransferItemDto
{
    public Guid Id { get; set; }
    public Guid TransferId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
}
