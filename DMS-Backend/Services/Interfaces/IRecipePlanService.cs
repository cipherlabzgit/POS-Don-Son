using DMS_Backend.Models.DTOs.RecipePlans;

namespace DMS_Backend.Services.Interfaces;

public interface IRecipePlanService
{
    Task<List<RecipePlanListDto>> GetAllAsync(bool? activeOnly = null, CancellationToken cancellationToken = default);
    Task<RecipePlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RecipePlanDetailDto> CreateAsync(CreateRecipePlanDto dto, CancellationToken cancellationToken = default);
    Task<RecipePlanDetailDto?> UpdateAsync(Guid id, UpdateRecipePlanDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RecipePlanDetailDto?> AddItemAsync(Guid planId, CreateRecipePlanItemDto dto, CancellationToken cancellationToken = default);
    Task<bool> RemoveItemAsync(Guid planId, Guid itemId, CancellationToken cancellationToken = default);
}
