using DMS_Backend.Models.DTOs.ApprovalQueue;

namespace DMS_Backend.Services.Interfaces;

public interface IApprovalQueueService
{
    Task<(IEnumerable<ApprovalQueueListDto> approvals, int totalCount)> GetPendingAsync(
        int page,
        int pageSize,
        string? approvalType = null,
        CancellationToken cancellationToken = default);

    Task<(IEnumerable<ApprovalQueueListDto> approvals, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? approvalType = null,
        string? status = null,
        CancellationToken cancellationToken = default);

    Task<ApprovalQueueDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ApprovalQueueDetailDto> CreateAsync(CreateApprovalQueueDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<ApprovalQueueDetailDto> ApproveAsync(Guid id, Guid approvedByUserId, string? notes = null, CancellationToken cancellationToken = default);

    Task<ApprovalQueueDetailDto> RejectAsync(Guid id, Guid rejectedByUserId, string rejectionReason, string? notes = null, CancellationToken cancellationToken = default);
}
