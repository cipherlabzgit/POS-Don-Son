using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Outlets;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OutletsController : ControllerBase
{
    private readonly IOutletService _outletService;

    public OutletsController(IOutletService outletService)
    {
        _outletService = outletService;
    }

    [HttpGet]
    [HasPermission("showroom:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? locationType = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (outlets, totalCount) = await _outletService.GetAllAsync(
            page, pageSize, search, locationType, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Outlets = outlets,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("showroom:view")]
    public async Task<ActionResult<ApiResponse<OutletDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outlet = await _outletService.GetByIdAsync(id, cancellationToken);
        if (outlet == null)
        {
            return NotFound(ApiResponse<OutletDetailDto>.FailureResponse(
                Error.NotFound("Outlet", id.ToString())));
        }

        return Ok(ApiResponse<OutletDetailDto>.SuccessResponse(outlet));
    }

    [HttpPost]
    [HasPermission("showroom:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OutletDetailDto>>> Create(
        [FromBody] CreateOutletDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var outlet = await _outletService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = outlet.Id },
                ApiResponse<OutletDetailDto>.SuccessResponse(outlet));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<OutletDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("showroom:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OutletDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateOutletDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var outlet = await _outletService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<OutletDetailDto>.SuccessResponse(outlet));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<OutletDetailDto>.FailureResponse(
                    Error.NotFound("Outlet", id.ToString())));
            }

            return Conflict(ApiResponse<OutletDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("showroom:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _outletService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Outlet deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("Outlet", id.ToString())));
        }
    }
}
