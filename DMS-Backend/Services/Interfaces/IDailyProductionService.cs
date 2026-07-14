using DMS_Backend.Models.DTOs.DailyProductions;

namespace DMS_Backend.Services.Interfaces;

public interface IDailyProductionService
{
    Task<(List<DailyProductionListDto> Productions, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status,
        Guid requestingUserId, bool viewAllRecords, bool showPreviousRecords,
        CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> GetByProductionNoAsync(string productionNo, CancellationToken cancellationToken = default);
    Task<List<string>> GetDistinctProductionNumbersAsync(CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto> CreateAsync(CreateDailyProductionDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> UpdateAsync(Guid id, UpdateDailyProductionDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DailyProductionDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
