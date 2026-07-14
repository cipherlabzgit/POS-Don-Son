using DMS_Backend.Models.DTOs.ShowroomOpenStock;

namespace DMS_Backend.Services.Interfaces;

public interface IShowroomOpenStockService
{
    Task<List<ShowroomOpenStockListDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ShowroomOpenStockDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ShowroomOpenStockDetailDto?> GetByOutletIdAsync(Guid outletId, CancellationToken cancellationToken = default);
    Task<ShowroomOpenStockDetailDto> CreateAsync(CreateShowroomOpenStockDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ShowroomOpenStockDetailDto?> UpdateAsync(Guid id, UpdateShowroomOpenStockDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
