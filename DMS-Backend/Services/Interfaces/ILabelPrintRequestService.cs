using DMS_Backend.Models.DTOs.LabelPrintRequests;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelPrintRequestService
{
    Task<(List<LabelPrintRequestListDto> LabelPrintRequests, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> GetByDisplayNoAsync(string displayNo, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto> CreateAsync(CreateLabelPrintRequestDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> UpdateAsync(Guid id, UpdateLabelPrintRequestDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<LabelPrintRequestDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
