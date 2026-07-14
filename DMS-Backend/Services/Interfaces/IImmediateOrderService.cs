using DMS_Backend.Models.DTOs.ImmediateOrders;

namespace DMS_Backend.Services.Interfaces;

public interface IImmediateOrderService
{
    Task<(IEnumerable<ImmediateOrderListDto> orders, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? outletId = null,
        Guid? deliveryTurnId = null,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// When <paramref name="viewerUserId"/> is set and the viewer is not super-admin, results are limited to orders created by that user.
    /// Omit <paramref name="viewerUserId"/> for internal aggregation (e.g. operation approvals) to include all outlets.
    /// </summary>
    Task<IEnumerable<ImmediateOrderListDto>> GetByDateAndTurnAsync(
        DateTime date,
        Guid turnId,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    /// <inheritdoc cref="GetByDateAndTurnAsync"/>
    Task<ImmediateOrderDetailDto?> GetByIdAsync(
        Guid id,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    Task<ImmediateOrderDetailDto> CreateAsync(
        CreateImmediateOrderDto dto,
        Guid userId,
        List<string> permissionCodes,
        CancellationToken cancellationToken = default);

    Task<ImmediateOrderDetailDto> SubmitForApprovalAsync(
        Guid id,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    Task<ImmediateOrderDetailDto> UpdateAsync(
        Guid id,
        UpdateImmediateOrderDto dto,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid id,
        Guid viewerUserId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    Task<ImmediateOrderDetailDto> ApproveAsync(
        Guid id,
        Guid approvedBy,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);

    Task<ImmediateOrderDetailDto> RejectAsync(
        Guid id,
        string reason,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default);
}
