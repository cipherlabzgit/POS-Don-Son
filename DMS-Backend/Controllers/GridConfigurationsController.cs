using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.GridConfigurations;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GridConfigurationsController : ControllerBase
{
    private readonly IGridConfigurationService _gridConfigurationService;

    public GridConfigurationsController(IGridConfigurationService gridConfigurationService)
    {
        _gridConfigurationService = gridConfigurationService;
    }

    [HttpGet]
    [HasPermission("grid-config:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (gridConfigurations, totalCount) = await _gridConfigurationService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            GridConfigurations = gridConfigurations,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("grid-config:view")]
    public async Task<ActionResult<ApiResponse<GridConfigurationDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var gridConfiguration = await _gridConfigurationService.GetByIdAsync(id, cancellationToken);
        if (gridConfiguration == null)
        {
            return NotFound(ApiResponse<GridConfigurationDetailDto>.FailureResponse(Error.NotFound("GridConfiguration", id.ToString())));
        }

        return Ok(ApiResponse<GridConfigurationDetailDto>.SuccessResponse(gridConfiguration));
    }

    [HttpPost]
    [HasPermission("grid-config:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<GridConfigurationDetailDto>>> Create(
        [FromBody] GridConfigurationCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var gridConfiguration = await _gridConfigurationService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = gridConfiguration.Id },
                ApiResponse<GridConfigurationDetailDto>.SuccessResponse(gridConfiguration));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<GridConfigurationDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("grid-config:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<GridConfigurationDetailDto>>> Update(
        Guid id,
        [FromBody] GridConfigurationUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var gridConfiguration = await _gridConfigurationService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<GridConfigurationDetailDto>.SuccessResponse(gridConfiguration));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<GridConfigurationDetailDto>.FailureResponse(Error.NotFound("GridConfiguration", id.ToString())));
            }
            return Conflict(ApiResponse<GridConfigurationDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("grid-config:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _gridConfigurationService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Grid configuration deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("GridConfiguration", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
