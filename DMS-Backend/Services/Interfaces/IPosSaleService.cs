using DMS_Backend.Models.DTOs.PosSales;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface IPosSaleService
{
    Task<(IReadOnlyList<PosSaleDetailDto> Sales, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId,
        DateTime? soldFromUtcInclusive,
        DateTime? soldToUtcExclusive,
        string? saleNoSearch,
        string? status,
        CancellationToken cancellationToken = default);

    Task<PosSaleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PosSale>> GetPendingSalesForApprovalsAsync(CancellationToken cancellationToken = default);

    Task<PosSaleDetailDto> CreateAsync(CreatePosSaleDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<BulkPosSaleResultDto> CreateBulkAsync(CreateBulkPosSalesDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<PosSaleDetailDto?> ApproveAsync(Guid id, Guid approverUserId, CancellationToken cancellationToken = default);

    Task<PosSaleDetailDto?> RejectAsync(Guid id, Guid rejectorUserId, string? reason, CancellationToken cancellationToken = default);

    /// <summary>Voids an approved sale (supervisor action). Records audit trail.</summary>
    Task<PosSaleDetailDto?> VoidAsync(Guid id, Guid userId, string? reason, CancellationToken cancellationToken = default);
}
