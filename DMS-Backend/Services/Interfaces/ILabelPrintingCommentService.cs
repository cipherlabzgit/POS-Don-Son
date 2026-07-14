using DMS_Backend.Models.DTOs.LabelPrintingComments;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelPrintingCommentService
{
    Task<IReadOnlyList<LabelPrintingCommentListDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default);

    Task<LabelPrintingCommentListDto> CreateAsync(LabelPrintingCommentCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<LabelPrintingCommentListDto> UpdateAsync(Guid id, LabelPrintingCommentUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);
}
