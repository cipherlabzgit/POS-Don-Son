using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.SystemSettings;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/system-settings")]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingService _systemSettingService;

    public SystemSettingsController(ISystemSettingService systemSettingService)
    {
        _systemSettingService = systemSettingService;
    }

    [HttpGet]
    [HasPermission("setting:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (settings, totalCount) = await _systemSettingService.GetAllAsync(
            page, pageSize, category, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Settings = settings,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("setting:view")]
    public async Task<ActionResult<ApiResponse<SystemSettingDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var setting = await _systemSettingService.GetByIdAsync(id, cancellationToken);
        if (setting == null)
        {
            return NotFound(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                Error.NotFound("SystemSetting", id.ToString())));
        }

        return Ok(ApiResponse<SystemSettingDetailDto>.SuccessResponse(setting));
    }

    [HttpGet("key/{key}")]
    [HasPermission("setting:view")]
    public async Task<ActionResult<ApiResponse<SystemSettingDetailDto>>> GetByKey(
        string key,
        CancellationToken cancellationToken = default)
    {
        var setting = await _systemSettingService.GetByKeyAsync(key, cancellationToken);
        if (setting == null)
        {
            return NotFound(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                Error.NotFound("SystemSetting", key)));
        }

        return Ok(ApiResponse<SystemSettingDetailDto>.SuccessResponse(setting));
    }

    [HttpPost]
    [HasPermission("setting:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SystemSettingDetailDto>>> Create(
        [FromBody] CreateSystemSettingDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var setting = await _systemSettingService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = setting.Id },
                ApiResponse<SystemSettingDetailDto>.SuccessResponse(setting));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("setting:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SystemSettingDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateSystemSettingDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var setting = await _systemSettingService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<SystemSettingDetailDto>.SuccessResponse(setting));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                    Error.NotFound("SystemSetting", id.ToString())));
            }

            return Conflict(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    /// <summary>Update only the value for a setting identified by its unique key (stable API for admin flags).</summary>
    [HttpPut("key/{key}")]
    [HasPermission("setting:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SystemSettingDetailDto>>> UpdateValueByKey(
        string key,
        [FromBody] UpdateSystemSettingValueDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var setting = await _systemSettingService.UpdateValueByKeyAsync(key, dto, userId, cancellationToken);
            return Ok(ApiResponse<SystemSettingDetailDto>.SuccessResponse(setting));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                    Error.NotFound("SystemSetting", key)));
            }

            return BadRequest(ApiResponse<SystemSettingDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("setting:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _systemSettingService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "System setting deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("Cannot delete"))
            {
                return BadRequest(ApiResponse<object>.FailureResponse(
                    Error.Validation(ex.Message)));
            }
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("SystemSetting", id.ToString())));
        }
    }
}
