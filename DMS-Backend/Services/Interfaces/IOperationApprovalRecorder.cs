using DMS_Backend.Models.DTOs.OperationApprovals;

namespace DMS_Backend.Services.Interfaces;

public interface IOperationApprovalRecorder
{
    Task<OperationApprovalDto> RecordTransitionAsync(CreateOperationApprovalDto dto, Guid performedBy, CancellationToken cancellationToken = default);
}
