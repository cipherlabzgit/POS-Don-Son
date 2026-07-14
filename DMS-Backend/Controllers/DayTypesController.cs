using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DayTypes;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/day-types")]
public class DayTypesController : ControllerBase
{
    private readonly IDayTypeService _dayTypeService;

    public DayTypesController(IDayTypeService dayTypeService)
    {
        _dayTypeService = dayTypeService;
    }

    [HttpGet]
    [HasPermission("day_type:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (dayTypes, totalCount) = await _dayTypeService.GetAllAsync(
            page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DayTypes = dayTypes,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("day_type:view")]
    public async Task<ActionResult<ApiResponse<DayTypeDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var dayType = await _dayTypeService.GetByIdAsync(id, cancellationToken);
        if (dayType == null)
        {
            return NotFound(ApiResponse<DayTypeDetailDto>.FailureResponse(
                Error.NotFound("DayType", id.ToString())));
        }

        return Ok(ApiResponse<DayTypeDetailDto>.SuccessResponse(dayType));
    }

    [HttpPost]
    [HasPermission("day_type:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DayTypeDetailDto>>> Create(
        [FromBody] CreateDayTypeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var dayType = await _dayTypeService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = dayType.Id },
                ApiResponse<DayTypeDetailDto>.SuccessResponse(dayType));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DayTypeDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("day_type:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DayTypeDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDayTypeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var dayType = await _dayTypeService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<DayTypeDetailDto>.SuccessResponse(dayType));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<DayTypeDetailDto>.FailureResponse(
                    Error.NotFound("DayType", id.ToString())));
            }

            return Conflict(ApiResponse<DayTypeDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("day_type:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _dayTypeService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Day type deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("DayType", id.ToString())));
        }
    }
}
