using DMS_Backend.Models.DTOs.DeliveryReturns;

namespace DMS_Backend.Services.Interfaces;

public interface IDeliveryReturnService
{
    Task<(List<DeliveryReturnListDto> DeliveryReturns, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> GetByReturnNoAsync(string returnNo, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto> CreateAsync(CreateDeliveryReturnDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> UpdateAsync(Guid id, UpdateDeliveryReturnDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DeliveryReturnDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
