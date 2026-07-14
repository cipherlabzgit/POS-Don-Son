namespace DMS_Backend.Models.DTOs.OperationApprovals;

public class OperationApprovalDto
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
    public string? DocumentNo { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public Guid PerformedBy { get; set; }
    public string? PerformedByName { get; set; }
    public DateTime PerformedAt { get; set; }
    public string? Remarks { get; set; }
}

public class CreateOperationApprovalDto
{
    public string DocumentType { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
    public string? DocumentNo { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}
