namespace DMS_Backend.Models.DTOs.ApprovalQueue;

public sealed class CreateApprovalQueueDto
{
    public required string ApprovalType { get; set; }
    public required Guid EntityId { get; set; }
    public string? EntityReference { get; set; }
    public required Guid RequestedById { get; set; }
    public string? RequestData { get; set; }
    public int Priority { get; set; } = 0;
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}
