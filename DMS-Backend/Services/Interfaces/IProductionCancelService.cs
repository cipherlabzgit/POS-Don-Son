using DMS_Backend.Models.DTOs.ProductionCancels;

namespace DMS_Backend.Services.Interfaces;

public interface IProductionCancelService
{
    Task<(List<ProductionCancelListDto> Cancellations, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate, 
        Guid? productId, string? status, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> GetByCancelNoAsync(string cancelNo, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto> CreateAsync(CreateProductionCancelDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> UpdateAsync(Guid id, UpdateProductionCancelDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<ProductionCancelDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
