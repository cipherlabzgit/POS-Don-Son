using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Users;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuthService _authService;

    public UsersController(IUserService userService, IAuthService authService)
    {
        _userService = userService;
        _authService = authService;
    }

    [HttpGet]
    [HasPermission("users:read")]
    public async Task<ActionResult<ApiResponse<object>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var (users, totalCount) = await _userService.GetAllAsync(page, pageSize, search, isActive, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Users = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("users:read")]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> GetUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<UserDetailDto>.FailureResponse(Error.NotFound("User", id.ToString())));
        }

        return Ok(ApiResponse<UserDetailDto>.SuccessResponse(user));
    }

    [HttpPost]
    [HasPermission("users:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> CreateUser(
        [FromBody] CreateUserDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _userService.CreateAsync(dto, currentUserId, cancellationToken);

            return CreatedAtAction(
                nameof(GetUser), 
                new { id = user.Id }, 
                ApiResponse<UserDetailDto>.SuccessResponse(user));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<UserDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("users:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _userService.UpdateAsync(id, dto, currentUserId, cancellationToken);

            return Ok(ApiResponse<UserDetailDto>.SuccessResponse(user));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<UserDetailDto>.FailureResponse(Error.NotFound("User", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<UserDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("users:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            await _userService.DeleteAsync(id, currentUserId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { message = "User deleted successfully" }));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("User", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/roles")]
    [HasPermission("users:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> AssignRoles(
        Guid id,
        [FromBody] AssignRolesDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            await _userService.AssignRolesAsync(id, dto.RoleIds, currentUserId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Roles assigned successfully" }));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("User", id.ToString())));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reset-password")]
    [HasPermission("users:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> AdminResetPassword(
        Guid id,
        [FromBody] AdminResetPasswordDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 12);
            await _userService.UpdatePasswordAsync(id, passwordHash, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Password reset successfully" }));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("User", id.ToString())));
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
