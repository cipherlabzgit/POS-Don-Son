using DMS_Backend.Models.DTOs.RoundingRules;

namespace DMS_Backend.Services.Interfaces;

public interface IRoundingRuleService
{
    Task<(List<RoundingRuleListDto> roundingRules, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<RoundingRuleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<RoundingRuleDetailDto> CreateAsync(RoundingRuleCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<RoundingRuleDetailDto> UpdateAsync(Guid id, RoundingRuleUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);

    Task<RoundingRulePreviewResponseDto> PreviewAsync(RoundingRulePreviewRequestDto dto, CancellationToken cancellationToken = default);
}
