using DMS_Backend.Models.DTOs.Deliveries;

namespace DMS_Backend.Services.Interfaces;

public interface IDeliveryService
{
    Task<(List<DeliveryListDto> Deliveries, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate, 
        Guid? outletId, string? status, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto?> GetByDeliveryNoAsync(string deliveryNo, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto> CreateAsync(
        CreateDeliveryDto dto,
        Guid userId,
        IReadOnlyCollection<string> permissionCodes,
        CancellationToken cancellationToken = default);

    Task<DeliveryDetailDto?> UpdateAsync(
        Guid id,
        UpdateDeliveryDto dto,
        Guid userId,
        IReadOnlyCollection<string> permissionCodes,
        CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DeliveryDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
