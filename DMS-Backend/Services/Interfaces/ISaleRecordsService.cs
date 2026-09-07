using DMS_Backend.Models.DTOs.SaleRecords;

namespace DMS_Backend.Services.Interfaces;

public interface ISaleRecordsService
{
    Task<SaleRecordsSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<SaleRecordsSettingsDto> UpdateSettingsAsync(
        UpdateSaleRecordsSettingsDto dto,
        Guid updatedByUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SaleRecordNotifyTargetDto>> GetNotifyTargetsAsync(
        DateTime processDate,
        CancellationToken cancellationToken = default);

    Task NotifyCashiersAsync(
        NotifyCashiersDto dto,
        Guid notifiedByUserId,
        CancellationToken cancellationToken = default);

    Task<PosSaleRecordsUnreadDto> GetUnreadCountAsync(
        Guid cashierUserId,
        CancellationToken cancellationToken = default);

    Task<PosSaleRecordsDto> GetPosRecordsAsync(
        Guid cashierUserId,
        CancellationToken cancellationToken = default);

    Task MarkReadAsync(Guid cashierUserId, CancellationToken cancellationToken = default);
}
