using DMS_Backend.Models.DTOs.FreezerStocks;

namespace DMS_Backend.Services.Interfaces;

public interface IFreezerStockService
{
    Task<(IEnumerable<FreezerStockListDto> stocks, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? productId = null,
        Guid? productionSectionId = null,
        CancellationToken cancellationToken = default);

    Task<FreezerStockDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<FreezerStockDetailDto?> GetCurrentStockAsync(
        Guid productId,
        Guid productionSectionId,
        CancellationToken cancellationToken = default);

    Task<FreezerStockDetailDto> AdjustStockAsync(
        AdjustFreezerStockDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<FreezerStockDetailDto> SetStockAsync(
        AdjustFreezerStockDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<FreezerStockHistoryDto>> GetHistoryAsync(
        Guid productId,
        Guid productionSectionId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
}
