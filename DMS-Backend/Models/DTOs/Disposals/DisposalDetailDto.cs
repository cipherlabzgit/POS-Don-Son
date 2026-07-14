namespace DMS_Backend.Models.DTOs.Disposals;

public sealed class DisposalDetailDto
{
    public Guid Id { get; set; }
    public string DisposalNo { get; set; } = string.Empty;
    public DateTime DisposalDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public List<DisposalItemDto> Items { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? UpdatedById { get; set; }
}

public sealed class DisposalItemDto
{
    public Guid Id { get; set; }
    public Guid DisposalId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? Reason { get; set; }
}
