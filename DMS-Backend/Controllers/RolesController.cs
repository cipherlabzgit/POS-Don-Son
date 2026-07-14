using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Roles;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission("roles:read")]
    public async Task<ActionResult<ApiResponse<object>>> GetRoles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var (roles, totalCount) = await _roleService.GetAllAsync(page, pageSize, search, isActive, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Roles = roles,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("roles:read")]
    public async Task<ActionResult<ApiResponse<RoleDetailDto>>> GetRole(Guid id, CancellationToken cancellationToken)
    {
        var role = await _roleService.GetByIdAsync(id, cancellationToken);
        if (role == null)
        {
            return NotFound(ApiResponse<RoleDetailDto>.FailureResponse(Error.NotFound("Role", id.ToString())));
        }

        return Ok(ApiResponse<RoleDetailDto>.SuccessResponse(role));
    }

    [HttpPost]
    [HasPermission("roles:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RoleDetailDto>>> CreateRole(
        [FromBody] CreateRoleDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var role = await _roleService.CreateAsync(dto, currentUserId, cancellationToken);

            return CreatedAtAction(
                nameof(GetRole),
                new { id = role.Id },
                ApiResponse<RoleDetailDto>.SuccessResponse(role));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RoleDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("roles:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RoleDetailDto>>> UpdateRole(
        Guid id,
        [FromBody] UpdateRoleDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var role = await _roleService.UpdateAsync(id, dto, currentUserId, cancellationToken);

            return Ok(ApiResponse<RoleDetailDto>.SuccessResponse(role));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<RoleDetailDto>.FailureResponse(Error.NotFound("Role", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RoleDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("roles:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRole(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            await _roleService.DeleteAsync(id, currentUserId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Role deleted successfully" }));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Role", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/permissions")]
    [HasPermission("roles:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> AssignPermissions(
        Guid id,
        [FromBody] AssignPermissionsDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            await _roleService.AssignPermissionsAsync(id, dto.PermissionIds, currentUserId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Permissions assigned successfully" }));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Role", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}
