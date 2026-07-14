using DMS_Backend.Models.DTOs.OutletEmployees;

namespace DMS_Backend.Services.Interfaces;

public interface IOutletEmployeeService
{
    Task<(IEnumerable<OutletEmployeeListDto> outletEmployees, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId = null,
        Guid? userId = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<OutletEmployeeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<OutletEmployeeDetailDto> CreateAsync(CreateOutletEmployeeDto dto, Guid createdByUserId, CancellationToken cancellationToken = default);

    Task<OutletEmployeeDetailDto> UpdateAsync(Guid id, UpdateOutletEmployeeDto dto, Guid updatedByUserId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
