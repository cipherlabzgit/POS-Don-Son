using DMS_Backend.Models.DTOs.LabelSettings;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelSettingService
{
    Task<(List<LabelSettingListDto> labelSettings, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<LabelSettingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<LabelSettingDetailDto> CreateAsync(LabelSettingCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<LabelSettingDetailDto> UpdateAsync(Guid id, LabelSettingUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> SettingKeyExistsAsync(string settingKey, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
