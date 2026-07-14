using DMS_Backend.Models.DTOs.Disposals;

namespace DMS_Backend.Services.Interfaces;

public interface IDisposalService
{
    Task<(List<DisposalListDto> Disposals, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> GetByDisposalNoAsync(string disposalNo, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto> CreateAsync(CreateDisposalDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> UpdateAsync(Guid id, UpdateDisposalDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<DisposalDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
