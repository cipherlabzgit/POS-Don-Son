using DMS_Backend.Models.DTOs.DeliveryPlans;

namespace DMS_Backend.Services.Interfaces;

public interface IDeliveryPlanService
{
    Task<(IEnumerable<DeliveryPlanListDto> plans, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto?> GetByPlanNoAsync(string planNo, CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto> CreateAsync(
        CreateDeliveryPlanDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto> UpdateAsync(
        Guid id,
        UpdateDeliveryPlanDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto> SubmitAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<DeliveryPlanItemDto>> BulkUpsertItemsAsync(
        Guid planId,
        List<BulkUpsertDeliveryPlanItemDto> items,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>Returns per-outlet delivery schedule (turns + products) for a given date range.</summary>
    Task<List<OutletDeliveryScheduleDto>> GetOutletScheduleAsync(
        DateTime fromDate,
        DateTime toDate,
        Guid? outletId = null,
        Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Preload planning window (next three SL calendar days from tomorrow) and active 5:00 AM delivery turns only.
    /// </summary>
    Task<DeliveryPlanningWindowDto> GetPlanningWindowAsync(CancellationToken cancellationToken = default);
}
