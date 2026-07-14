using DMS_Backend.Models.DTOs.SectionConsumables;

namespace DMS_Backend.Services.Interfaces;

public interface ISectionConsumableService
{
    Task<(IEnumerable<SectionConsumableListDto> sectionConsumables, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? productionSectionId = null,
        Guid? ingredientId = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<SectionConsumableDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<SectionConsumableDetailDto> CreateAsync(CreateSectionConsumableDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<SectionConsumableDetailDto> UpdateAsync(Guid id, UpdateSectionConsumableDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
