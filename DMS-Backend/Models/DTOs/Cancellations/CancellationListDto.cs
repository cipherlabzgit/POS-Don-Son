namespace DMS_Backend.Models.DTOs.Cancellations;

public sealed class CancellationListDto
{
    public Guid Id { get; set; }
    public string CancellationNo { get; set; } = string.Empty;
    public DateTime CancellationDate { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public DateTime DeliveredDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string OutletCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedById { get; set; }
    public Guid UpdatedById { get; set; }
    public string? UpdatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectedByName { get; set; }
    public DateTime? RejectedDate { get; set; }
}
