using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.UnitOfMeasures;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UnitOfMeasuresController : ControllerBase
{
    private readonly IUnitOfMeasureService _unitOfMeasureService;

    public UnitOfMeasuresController(IUnitOfMeasureService unitOfMeasureService)
    {
        _unitOfMeasureService = unitOfMeasureService;
    }

    [HttpGet]
    [HasPermission("unit-of-measure:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (unitOfMeasures, totalCount) = await _unitOfMeasureService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            UnitOfMeasures = unitOfMeasures,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("unit-of-measure:view")]
    public async Task<ActionResult<ApiResponse<UnitOfMeasureDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var uom = await _unitOfMeasureService.GetByIdAsync(id, cancellationToken);
        if (uom == null)
        {
            return NotFound(ApiResponse<UnitOfMeasureDetailDto>.FailureResponse(Error.NotFound("Unit of measure", id.ToString())));
        }

        return Ok(ApiResponse<UnitOfMeasureDetailDto>.SuccessResponse(uom));
    }

    [HttpPost]
    [HasPermission("unit-of-measure:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<UnitOfMeasureDetailDto>>> Create(
        [FromBody] CreateUnitOfMeasureDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var uom = await _unitOfMeasureService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = uom.Id },
                ApiResponse<UnitOfMeasureDetailDto>.SuccessResponse(uom));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<UnitOfMeasureDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("unit-of-measure:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<UnitOfMeasureDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateUnitOfMeasureDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var uom = await _unitOfMeasureService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<UnitOfMeasureDetailDto>.SuccessResponse(uom));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<UnitOfMeasureDetailDto>.FailureResponse(Error.NotFound("Unit of measure", id.ToString())));
            }
            return Conflict(ApiResponse<UnitOfMeasureDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("unit-of-measure:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _unitOfMeasureService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Unit of measure deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Unit of measure", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
