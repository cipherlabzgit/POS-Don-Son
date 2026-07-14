using DMS_Backend.Models.DTOs.DefaultQuantities;

namespace DMS_Backend.Services.Interfaces;

public interface IDefaultQuantityService
{
    Task<(IEnumerable<DefaultQuantityListDto> defaultQuantities, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId = null,
        Guid? dayTypeId = null,
        Guid? productId = null,
        CancellationToken cancellationToken = default);

    Task<DefaultQuantityDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DefaultQuantityDetailDto?> GetByCompositeKeyAsync(
        Guid outletId,
        Guid dayTypeId,
        Guid productId,
        CancellationToken cancellationToken = default);

    Task<DefaultQuantityDetailDto> CreateAsync(
        CreateDefaultQuantityDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<DefaultQuantityDetailDto> UpdateAsync(
        Guid id,
        UpdateDefaultQuantityDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IEnumerable<DefaultQuantityDetailDto>> BulkUpsertAsync(
        List<BulkUpsertDefaultQuantityDto> dtos,
        Guid userId,
        CancellationToken cancellationToken = default);
}
