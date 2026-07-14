using DMS_Backend.Models.DTOs.UnitOfMeasures;

namespace DMS_Backend.Services.Interfaces;

public interface IUnitOfMeasureService
{
    Task<(List<UnitOfMeasureListItemDto> unitOfMeasures, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<UnitOfMeasureDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<UnitOfMeasureDetailDto> CreateAsync(CreateUnitOfMeasureDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<UnitOfMeasureDetailDto> UpdateAsync(Guid id, UpdateUnitOfMeasureDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
