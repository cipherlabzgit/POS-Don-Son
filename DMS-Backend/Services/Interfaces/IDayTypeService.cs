using DMS_Backend.Models.DTOs.DayTypes;

namespace DMS_Backend.Services.Interfaces;

public interface IDayTypeService
{
    Task<(IEnumerable<DayTypeListDto> dayTypes, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<DayTypeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DayTypeDetailDto> CreateAsync(CreateDayTypeDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<DayTypeDetailDto> UpdateAsync(Guid id, UpdateDayTypeDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
