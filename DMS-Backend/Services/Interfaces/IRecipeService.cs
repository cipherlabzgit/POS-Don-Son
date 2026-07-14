using DMS_Backend.Models.DTOs.Recipes;

namespace DMS_Backend.Services.Interfaces;

public interface IRecipeService
{
    Task<(List<RecipeListDto> recipes, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        Guid? productId = null,
        CancellationToken cancellationToken = default);

    Task<RecipeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<RecipeDetailDto?> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default);

    Task<RecipeDetailDto> CreateAsync(RecipeCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<RecipeDetailDto> UpdateAsync(Guid id, RecipeUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<RecipeCalculationDto> CalculateIngredientsAsync(Guid productId, decimal quantity, CancellationToken cancellationToken = default);
}
