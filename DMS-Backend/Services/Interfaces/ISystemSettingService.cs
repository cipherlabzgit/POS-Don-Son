using DMS_Backend.Models.DTOs.SystemSettings;

namespace DMS_Backend.Services.Interfaces;

public interface ISystemSettingService
{
    Task<(IEnumerable<SystemSettingListDto> settings, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? category = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<SystemSettingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    Task<SystemSettingDetailDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);

    Task<SystemSettingDetailDto> CreateAsync(CreateSystemSettingDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<SystemSettingDetailDto> UpdateAsync(Guid id, UpdateSystemSettingDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<SystemSettingDetailDto> UpdateValueByKeyAsync(string settingKey, UpdateSystemSettingValueDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> KeyExistsAsync(string key, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
