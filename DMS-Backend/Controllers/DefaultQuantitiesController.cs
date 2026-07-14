using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DefaultQuantities;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/default-quantities")]
public class DefaultQuantitiesController : ControllerBase
{
    private readonly IDefaultQuantityService _defaultQuantityService;

    public DefaultQuantitiesController(IDefaultQuantityService defaultQuantityService)
    {
        _defaultQuantityService = defaultQuantityService;
    }

    [HttpGet]
    [HasPermission("default_quantity:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] Guid? outletId = null,
        [FromQuery] Guid? dayTypeId = null,
        [FromQuery] Guid? productId = null,
        CancellationToken cancellationToken = default)
    {
        var (defaultQuantities, totalCount) = await _defaultQuantityService.GetAllAsync(
            page, pageSize, outletId, dayTypeId, productId, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DefaultQuantities = defaultQuantities,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("default_quantity:view")]
    public async Task<ActionResult<ApiResponse<DefaultQuantityDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _defaultQuantityService.GetByIdAsync(id, cancellationToken);
        if (defaultQuantity == null)
        {
            return NotFound(ApiResponse<DefaultQuantityDetailDto>.FailureResponse(
                Error.NotFound("DefaultQuantity", id.ToString())));
        }

        return Ok(ApiResponse<DefaultQuantityDetailDto>.SuccessResponse(defaultQuantity));
    }

    [HttpGet("by-key")]
    [HasPermission("default_quantity:view")]
    public async Task<ActionResult<ApiResponse<DefaultQuantityDetailDto>>> GetByCompositeKey(
        [FromQuery] Guid outletId,
        [FromQuery] Guid dayTypeId,
        [FromQuery] Guid productId,
        CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _defaultQuantityService.GetByCompositeKeyAsync(
            outletId, dayTypeId, productId, cancellationToken);

        if (defaultQuantity == null)
        {
            return NotFound(ApiResponse<DefaultQuantityDetailDto>.FailureResponse(
                Error.NotFound("DefaultQuantity", $"Outlet={outletId}, DayType={dayTypeId}, Product={productId}")));
        }

        return Ok(ApiResponse<DefaultQuantityDetailDto>.SuccessResponse(defaultQuantity));
    }

    [HttpPost]
    [HasPermission("default_quantity:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DefaultQuantityDetailDto>>> Create(
        [FromBody] CreateDefaultQuantityDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var defaultQuantity = await _defaultQuantityService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = defaultQuantity.Id },
                ApiResponse<DefaultQuantityDetailDto>.SuccessResponse(defaultQuantity));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DefaultQuantityDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("default_quantity:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DefaultQuantityDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDefaultQuantityDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var defaultQuantity = await _defaultQuantityService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<DefaultQuantityDetailDto>.SuccessResponse(defaultQuantity));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<DefaultQuantityDetailDto>.FailureResponse(
                    Error.NotFound("DefaultQuantity", id.ToString())));
            }

            return Conflict(ApiResponse<DefaultQuantityDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("default_quantity:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _defaultQuantityService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Default quantity deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("DefaultQuantity", id.ToString())));
        }
    }

    [HttpPost("bulk-upsert")]
    [HasPermission("default_quantity:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<IEnumerable<DefaultQuantityDetailDto>>>> BulkUpsert(
        [FromBody] List<BulkUpsertDefaultQuantityDto> dtos,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var results = await _defaultQuantityService.BulkUpsertAsync(dtos, userId, cancellationToken);

            return Ok(ApiResponse<IEnumerable<DefaultQuantityDetailDto>>.SuccessResponse(results));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<IEnumerable<DefaultQuantityDetailDto>>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
