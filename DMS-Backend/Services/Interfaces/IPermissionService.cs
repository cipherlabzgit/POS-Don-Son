using DMS_Backend.Models.DTOs.Permissions;

namespace DMS_Backend.Services.Interfaces;

public interface IPermissionService
{
    Task<List<PermissionDto>> GetAllAsync(bool? isActive = null, CancellationToken cancellationToken = default);
    Task<List<PermissionsByModuleDto>> GetGroupedByModuleAsync(bool? isActive = null, CancellationToken cancellationToken = default);
}
