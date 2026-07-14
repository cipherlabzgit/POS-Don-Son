using DMS_Backend.Models.DTOs.ProductionSections;

namespace DMS_Backend.Services.Interfaces;

public interface IProductionSectionService
{
    Task<(IEnumerable<ProductionSectionListDto> productionSections, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<ProductionSectionDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProductionSectionDetailDto> CreateAsync(CreateProductionSectionDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<ProductionSectionDetailDto> UpdateAsync(Guid id, UpdateProductionSectionDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
