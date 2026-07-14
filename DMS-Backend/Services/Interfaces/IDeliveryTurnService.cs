using DMS_Backend.Models.DTOs.DeliveryTurns;

namespace DMS_Backend.Services.Interfaces;

public interface IDeliveryTurnService
{
    Task<(IEnumerable<DeliveryTurnListDto> deliveryTurns, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<DeliveryTurnDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DeliveryTurnDetailDto> CreateAsync(CreateDeliveryTurnDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<DeliveryTurnDetailDto> UpdateAsync(Guid id, UpdateDeliveryTurnDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
