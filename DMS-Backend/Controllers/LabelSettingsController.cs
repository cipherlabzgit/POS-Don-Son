using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.LabelSettings;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/label-settings")]
public class LabelSettingsController : ControllerBase
{
    private readonly ILabelSettingService _labelSettingService;

    public LabelSettingsController(ILabelSettingService labelSettingService)
    {
        _labelSettingService = labelSettingService;
    }

    [HttpGet]
    [HasPermission("label-settings:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (labelSettings, totalCount) = await _labelSettingService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            LabelSettings = labelSettings,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("label-settings:view")]
    public async Task<ActionResult<ApiResponse<LabelSettingDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var labelSetting = await _labelSettingService.GetByIdAsync(id, cancellationToken);
        if (labelSetting == null)
        {
            return NotFound(ApiResponse<LabelSettingDetailDto>.FailureResponse(Error.NotFound("LabelSetting", id.ToString())));
        }

        return Ok(ApiResponse<LabelSettingDetailDto>.SuccessResponse(labelSetting));
    }

    [HttpPost]
    [HasPermission("label-settings:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelSettingDetailDto>>> Create(
        [FromBody] LabelSettingCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelSetting = await _labelSettingService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = labelSetting.Id },
                ApiResponse<LabelSettingDetailDto>.SuccessResponse(labelSetting));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<LabelSettingDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("label-settings:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelSettingDetailDto>>> Update(
        Guid id,
        [FromBody] LabelSettingUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelSetting = await _labelSettingService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<LabelSettingDetailDto>.SuccessResponse(labelSetting));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<LabelSettingDetailDto>.FailureResponse(Error.NotFound("LabelSetting", id.ToString())));
            }
            return Conflict(ApiResponse<LabelSettingDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("label-settings:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _labelSettingService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Label setting deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("LabelSetting", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
