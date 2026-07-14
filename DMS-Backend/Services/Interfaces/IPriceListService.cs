using DMS_Backend.Models.DTOs.PriceLists;

namespace DMS_Backend.Services.Interfaces;

public interface IPriceListService
{
    Task<(List<PriceListListDto> priceLists, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<PriceListDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PriceListDetailDto> CreateAsync(PriceListCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<PriceListDetailDto> UpdateAsync(Guid id, PriceListUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
