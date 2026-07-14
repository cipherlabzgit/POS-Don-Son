using DMS_Backend.Models.DTOs.GridConfigurations;

namespace DMS_Backend.Services.Interfaces;

public interface IGridConfigurationService
{
    Task<(List<GridConfigurationListDto> gridConfigurations, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<GridConfigurationDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<GridConfigurationDetailDto> CreateAsync(GridConfigurationCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<GridConfigurationDetailDto> UpdateAsync(Guid id, GridConfigurationUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
