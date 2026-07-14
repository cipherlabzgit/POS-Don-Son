using DMS_Backend.Models.DTOs.Ingredients;

namespace DMS_Backend.Services.Interfaces;

public interface IIngredientService
{
    Task<(List<IngredientListItemDto> ingredients, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        Guid? categoryId = null,
        string? ingredientType = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<IngredientDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IngredientDetailDto> CreateAsync(CreateIngredientDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<IngredientDetailDto> UpdateAsync(Guid id, UpdateIngredientDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
