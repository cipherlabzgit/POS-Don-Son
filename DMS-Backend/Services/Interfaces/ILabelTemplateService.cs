using DMS_Backend.Models.DTOs.LabelTemplates;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelTemplateService
{
    Task<(List<LabelTemplateListDto> labelTemplates, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<LabelTemplateDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<LabelTemplateDetailDto> CreateAsync(LabelTemplateCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<LabelTemplateDetailDto> UpdateAsync(Guid id, LabelTemplateUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<LabelTemplateDetailDto> AssignPrinterAsync(Guid id, AssignLabelTemplatePrinterDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
