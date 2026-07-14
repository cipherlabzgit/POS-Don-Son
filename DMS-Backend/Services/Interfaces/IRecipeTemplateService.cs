using DMS_Backend.Models.DTOs.RecipeTemplates;

namespace DMS_Backend.Services.Interfaces;

public interface IRecipeTemplateService
{
    Task<(List<RecipeTemplateListDto> templates, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<RecipeTemplateDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<RecipeTemplateDetailDto> CreateAsync(RecipeTemplateCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<RecipeTemplateDetailDto> UpdateAsync(Guid id, RecipeTemplateUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);

    // Component management
    Task<RecipeTemplateComponentDto> AddComponentAsync(CreateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default);
    Task<RecipeTemplateComponentDto?> UpdateComponentAsync(Guid componentId, UpdateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteComponentAsync(Guid componentId, CancellationToken cancellationToken = default);

    Task<RecipeTemplateIngredientDto> AddIngredientAsync(Guid componentId, CreateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default);
    Task<RecipeTemplateIngredientDto?> UpdateIngredientAsync(Guid ingredientId, UpdateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteIngredientAsync(Guid ingredientId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Loads template components+ingredients into an existing Recipe as a starting point.
    /// </summary>
    Task<int> LoadFromTemplateAsync(LoadFromTemplateDto dto, CancellationToken cancellationToken = default);
}
