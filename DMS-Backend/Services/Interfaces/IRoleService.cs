using DMS_Backend.Models.DTOs.Roles;

namespace DMS_Backend.Services.Interfaces;

public interface IRoleService
{
    Task<(List<RoleListItemDto> Roles, int TotalCount)> GetAllAsync(int page, int pageSize, string? search, bool? isActive, CancellationToken cancellationToken = default);
    Task<RoleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RoleDetailDto> CreateAsync(CreateRoleDto dto, Guid createdById, CancellationToken cancellationToken = default);
    Task<RoleDetailDto> UpdateAsync(Guid id, UpdateRoleDto dto, Guid updatedById, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid deletedById, CancellationToken cancellationToken = default);
    Task AssignPermissionsAsync(Guid roleId, List<Guid> permissionIds, Guid updatedById, CancellationToken cancellationToken = default);
    Task<bool> NameExistsAsync(string name, Guid? excludeRoleId = null, CancellationToken cancellationToken = default);
}
