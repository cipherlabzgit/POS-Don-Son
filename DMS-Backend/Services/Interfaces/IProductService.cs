using DMS_Backend.Models.DTOs.Products;

namespace DMS_Backend.Services.Interfaces;

public interface IProductService
{
    Task<(List<ProductListItemDto> products, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        Guid? categoryId = null,
        bool? activeOnly = null,
        bool? displayInPosOnly = null,
        CancellationToken cancellationToken = default);

    Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProductDetailDto> CreateAsync(CreateProductDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<ProductDetailDto> UpdateAsync(Guid id, UpdateProductDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
