using DMS_Backend.Models.DTOs.AdministratorDeliveryPlan;
using DMS_Backend.Models.DTOs.DeliveryPlans;

namespace DMS_Backend.Services.Interfaces;

public interface IAdministratorDeliveryPlanService
{
    Task<IReadOnlyList<AdministratorDeliveryScheduleDto>> GetSchedulesAsync(CancellationToken cancellationToken = default);

    Task<AdministratorDeliveryPlanWindowDto> GetPlanningWindowAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DeliveryPlanListDto>> GetPlansInWindowAsync(CancellationToken cancellationToken = default);

    Task<DeliveryPlanDetailDto> QuickCreateAndSyncAsync(
        AdministratorQuickCreateDeliveryPlanDto dto,
        Guid userId,
        List<string> permissionCodes,
        CancellationToken cancellationToken = default);
}
