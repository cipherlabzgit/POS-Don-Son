namespace DMS_Backend.Models.DTOs.ApprovalQueue;

public sealed class RejectApprovalDto
{
    public required string RejectionReason { get; set; }
    public string? Notes { get; set; }
}
