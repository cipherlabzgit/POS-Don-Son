using DMS_Backend.Models.DTOs.ShowroomLabelRequest;

namespace DMS_Backend.Services.Interfaces;

public interface IShowroomLabelRequestService
{
    Task<List<ShowroomLabelRequestListDto>> GetAllAsync(
        int page = 1, 
        int pageSize = 10,
        Guid? outletId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);

    Task<ShowroomLabelRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    Task<ShowroomLabelRequestDetailDto> CreateAsync(
        CreateShowroomLabelRequestDto dto, 
        Guid userId, 
        CancellationToken cancellationToken = default);

    Task<ShowroomLabelRequestDetailDto?> UpdateAsync(
        Guid id,
        UpdateShowroomLabelRequestDto dto, 
        Guid userId, 
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
