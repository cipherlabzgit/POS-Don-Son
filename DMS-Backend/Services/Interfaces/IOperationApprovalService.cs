using DMS_Backend.Models.DTOs.OperationApprovals;

namespace DMS_Backend.Services.Interfaces;

public interface IOperationApprovalService
{
    Task<OperationApprovalsSummaryDto> GetPendingApprovalsAsync(Guid requestingUserId, CancellationToken cancellationToken = default);

    /// <summary>Records a status transition for any document type.</summary>
    Task<OperationApprovalDto> RecordTransitionAsync(CreateOperationApprovalDto dto, Guid performedBy, CancellationToken cancellationToken = default);

    /// <summary>Returns all approval records for a specific document (audit trail).</summary>
    Task<List<OperationApprovalDto>> GetByDocumentAsync(string documentType, Guid documentId, CancellationToken cancellationToken = default);

    /// <summary>Returns recent approval activity across all document types, newest first.</summary>
    Task<List<OperationApprovalDto>> GetRecentAsync(int limit = 50, string? documentType = null, CancellationToken cancellationToken = default);
}
