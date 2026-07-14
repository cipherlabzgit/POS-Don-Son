using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Permissions;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [HasPermission("permissions:read")]
    public async Task<ActionResult<ApiResponse<List<PermissionDto>>>> GetPermissions(
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var permissions = await _permissionService.GetAllAsync(isActive, cancellationToken);
        return Ok(ApiResponse<List<PermissionDto>>.SuccessResponse(permissions));
    }

    [HttpGet("grouped")]
    [HasPermission("permissions:read")]
    public async Task<ActionResult<ApiResponse<List<PermissionsByModuleDto>>>> GetPermissionsGrouped(
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var grouped = await _permissionService.GetGroupedByModuleAsync(isActive, cancellationToken);
        return Ok(ApiResponse<List<PermissionsByModuleDto>>.SuccessResponse(grouped));
    }
}
