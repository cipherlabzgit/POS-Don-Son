using DMS_Backend.Models.DTOs.ProductWeightVariants;

namespace DMS_Backend.Services.Interfaces;

public interface IProductWeightVariantService
{
    Task<List<ProductWeightVariantDto>> GetByProductAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<ProductWeightVariantDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductWeightVariantDto> CreateAsync(CreateProductWeightVariantDto dto, CancellationToken cancellationToken = default);
    Task<ProductWeightVariantDto?> UpdateAsync(Guid id, UpdateProductWeightVariantDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductWeightVariantDto?> SetDefaultAsync(Guid id, CancellationToken cancellationToken = default);
}
