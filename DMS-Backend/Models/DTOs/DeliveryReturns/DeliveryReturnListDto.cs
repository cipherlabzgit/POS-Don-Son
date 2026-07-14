namespace DMS_Backend.Models.DTOs.DeliveryReturns;

public sealed class DeliveryReturnListDto
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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public Guid UpdatedById { get; set; }
    public string? UpdatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
}
