using DMS_Backend.Models.DTOs.Outlets;

namespace DMS_Backend.Services.Interfaces;

public interface IOutletService
{
    Task<(IEnumerable<OutletListDto> outlets, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        string? locationType = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<OutletDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<OutletDetailDto> CreateAsync(CreateOutletDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<OutletDetailDto> UpdateAsync(Guid id, UpdateOutletDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
