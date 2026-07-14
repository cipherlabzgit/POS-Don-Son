using DMS_Backend.Models.DTOs.DailyProductionPlans;

namespace DMS_Backend.Services.Interfaces;

public interface IDailyProductionPlanService
{
    Task<(List<DailyProductionPlanListDto> Plans, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate, 
        Guid? productId, string? status, string? priority, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> GetByPlanNoAsync(string planNo, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto> CreateAsync(CreateDailyProductionPlanDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> SubmitForApprovalAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> UpdateAsync(Guid id, UpdateDailyProductionPlanDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> StartAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DailyProductionPlanDetailDto?> CompleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
