using DMS_Backend.Models.DTOs.StockAdjustments;

namespace DMS_Backend.Services.Interfaces;

public interface IStockAdjustmentService
{
    Task<(List<StockAdjustmentListDto> Adjustments, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate, 
        Guid? productId, string? status, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> GetByAdjustmentNoAsync(string adjustmentNo, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto> CreateAsync(CreateStockAdjustmentDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> UpdateAsync(Guid id, UpdateStockAdjustmentDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
