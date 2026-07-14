using DMS_Backend.Models.DTOs.Categories;

namespace DMS_Backend.Services.Interfaces;

public interface ICategoryService
{
    Task<(List<CategoryListItemDto> categories, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        bool? displayInPosOnly = null,
        CancellationToken cancellationToken = default);

    Task<CategoryDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CategoryDetailDto> CreateAsync(CreateCategoryDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<CategoryDetailDto> UpdateAsync(Guid id, UpdateCategoryDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
