namespace DMS_Backend.Models.DTOs.ApprovalQueue;

public sealed class ApprovalQueueListDto
{
    public Guid Id { get; set; }
    public string ApprovalType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? EntityReference { get; set; }
    public Guid RequestedById { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public int Priority { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>When <see cref="ApprovalType"/> is StockAdjustment: business date of the adjustment document.</summary>
    public DateTime? AdjustmentDate { get; set; }

    /// <summary>When <see cref="ApprovalType"/> is StockAdjustment: last update timestamp on the adjustment entity.</summary>
    public DateTime? EntityUpdatedAt { get; set; }

    /// <summary>When <see cref="ApprovalType"/> is StockAdjustment: display name of the user who last edited the adjustment.</summary>
    public string? EntityUpdatedByName { get; set; }
}
