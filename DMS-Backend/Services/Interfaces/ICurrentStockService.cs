using DMS_Backend.Models.DTOs.CurrentStock;

namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Service for computing current stock positions.
/// Note: CurrentStock is not a stored entity, it's computed on-demand from multiple sources.
/// </summary>
public interface ICurrentStockService
{
    Task<List<CurrentStockDto>> GetAllAsync(DateTime? forDate = null, CancellationToken cancellationToken = default);
    Task<CurrentStockDto?> GetByProductIdAsync(Guid productId, DateTime? forDate = null, CancellationToken cancellationToken = default);
}
