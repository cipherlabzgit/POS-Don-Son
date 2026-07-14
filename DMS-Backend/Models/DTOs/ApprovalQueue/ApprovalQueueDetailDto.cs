namespace DMS_Backend.Models.DTOs.ApprovalQueue;

public sealed class ApprovalQueueDetailDto
{
    public Guid Id { get; set; }
    public string ApprovalType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? EntityReference { get; set; }
    public Guid RequestedById { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string RequestedByEmail { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public string? ApprovedByEmail { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? RequestData { get; set; }
    public int Priority { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
