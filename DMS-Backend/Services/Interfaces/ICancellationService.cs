using DMS_Backend.Models.DTOs.Cancellations;

namespace DMS_Backend.Services.Interfaces;

public interface ICancellationService
{
    Task<(List<CancellationListDto> Cancellations, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> GetByCancellationNoAsync(string cancellationNo, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto> CreateAsync(CreateCancellationDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> UpdateAsync(Guid id, UpdateCancellationDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CancellationDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
