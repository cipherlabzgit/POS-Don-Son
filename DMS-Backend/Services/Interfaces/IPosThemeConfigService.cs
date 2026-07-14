using DMS_Backend.Models.DTOs.PosTheme;

namespace DMS_Backend.Services.Interfaces;

public interface IPosThemeConfigService
{
    Task<(List<PosThemeConfigDto> Themes, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search,
        bool? activeOnly,
        CancellationToken cancellationToken = default);

    Task<PosThemeConfigDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ActivePosThemeDto> GetActiveThemeAsync(CancellationToken cancellationToken = default);

    Task<PosThemeConfigDto> CreateAsync(
        CreatePosThemeConfigDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<PosThemeConfigDto> UpdateAsync(
        Guid id,
        UpdatePosThemeConfigDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PosThemeConfigDto> SetActiveThemeAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default);
}
