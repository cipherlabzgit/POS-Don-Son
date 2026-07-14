using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.PosTheme;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/pos-theme-configs")]
public class PosThemeConfigsController : ControllerBase
{
    private readonly IPosThemeConfigService _service;

    public PosThemeConfigsController(IPosThemeConfigService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all POS theme configurations (Admin only)
    /// </summary>
    [HttpGet]
    [HasPermission("pos-theme:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (themes, totalCount) = await _service.GetAllAsync(
            page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Themes = themes,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    /// <summary>
    /// Get POS theme by ID (Admin only)
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission("pos-theme:view")]
    public async Task<ActionResult<ApiResponse<PosThemeConfigDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var theme = await _service.GetByIdAsync(id, cancellationToken);
        if (theme == null)
        {
            return NotFound(ApiResponse<PosThemeConfigDto>.FailureResponse(
                Error.NotFound("PosThemeConfig", id.ToString())));
        }

        return Ok(ApiResponse<PosThemeConfigDto>.SuccessResponse(theme));
    }

    /// <summary>
    /// Get the currently active theme (Available to all authenticated users including POS)
    /// </summary>
    [HttpGet("active")]
    [Authorize] // Only requires authentication, no specific permission
    public async Task<ActionResult<ApiResponse<ActivePosThemeDto>>> GetActiveTheme(
        CancellationToken cancellationToken = default)
    {
        var theme = await _service.GetActiveThemeAsync(cancellationToken);
        return Ok(ApiResponse<ActivePosThemeDto>.SuccessResponse(theme));
    }

    /// <summary>
    /// Create new POS theme (Admin only)
    /// </summary>
    [HttpPost]
    [HasPermission("pos-theme:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosThemeConfigDto>>> Create(
        [FromBody] CreatePosThemeConfigDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var theme = await _service.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = theme.Id },
                ApiResponse<PosThemeConfigDto>.SuccessResponse(theme));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<PosThemeConfigDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    /// <summary>
    /// Update POS theme (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission("pos-theme:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosThemeConfigDto>>> Update(
        Guid id,
        [FromBody] UpdatePosThemeConfigDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var theme = await _service.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<PosThemeConfigDto>.SuccessResponse(theme));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<PosThemeConfigDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    /// <summary>
    /// Delete POS theme (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("pos-theme:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _service.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Theme deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    /// <summary>
    /// Set a theme as active (Admin only)
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    [HasPermission("pos-theme:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosThemeConfigDto>>> SetActive(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var theme = await _service.SetActiveThemeAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<PosThemeConfigDto>.SuccessResponse(theme));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<PosThemeConfigDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
