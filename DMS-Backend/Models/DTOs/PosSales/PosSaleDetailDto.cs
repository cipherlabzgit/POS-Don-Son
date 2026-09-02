namespace DMS_Backend.Models.DTOs.PosSales;

public sealed class PosSaleDetailDto
{
    public Guid Id { get; set; }
    public string SaleNo { get; set; } = string.Empty;
    public DateTime SoldAt { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? ClientMutationId { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectedByName { get; set; }
    public string? RejectionReason { get; set; }
    public bool CancelRequested { get; set; }
    public string? CancellationReason { get; set; }
    public IReadOnlyList<PosSaleLineDetailDto> Lines { get; set; } = Array.Empty<PosSaleLineDetailDto>();
}

public sealed class PosSaleLineDetailDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
