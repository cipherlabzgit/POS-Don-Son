namespace DMS_Backend.Models.DTOs.OperationApprovals;

public sealed class OperationApprovalItemDto
{
    public Guid Id { get; set; }
    public string ApprovalType { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RequestedByName { get; set; }
    public string? Description { get; set; }
    public decimal? TotalValue { get; set; }
    public int? ItemCount { get; set; }
}
