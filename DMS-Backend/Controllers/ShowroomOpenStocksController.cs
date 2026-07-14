using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ShowroomOpenStock;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/showroom-open-stocks")]
public class ShowroomOpenStocksController : ControllerBase
{
    private readonly IShowroomOpenStockService _showroomOpenStockService;

    public ShowroomOpenStocksController(IShowroomOpenStockService showroomOpenStockService)
    {
        _showroomOpenStockService = showroomOpenStockService;
    }

    [HttpGet]
    [HasPermission("operation:showroom-open-stock:view")]
    public async Task<ActionResult<ApiResponse<List<ShowroomOpenStockListDto>>>> GetAll(
        CancellationToken cancellationToken = default)
    {
        var showroomOpenStocks = await _showroomOpenStockService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<List<ShowroomOpenStockListDto>>.SuccessResponse(showroomOpenStocks));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:showroom-open-stock:view")]
    public async Task<ActionResult<ApiResponse<ShowroomOpenStockDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var showroomOpenStock = await _showroomOpenStockService.GetByIdAsync(id, cancellationToken);
        if (showroomOpenStock == null)
        {
            return NotFound(ApiResponse<ShowroomOpenStockDetailDto>.FailureResponse(
                Error.NotFound("ShowroomOpenStock", id.ToString())));
        }

        return Ok(ApiResponse<ShowroomOpenStockDetailDto>.SuccessResponse(showroomOpenStock));
    }

    [HttpGet("by-outlet/{outletId:guid}")]
    [HasPermission("operation:showroom-open-stock:view")]
    public async Task<ActionResult<ApiResponse<ShowroomOpenStockDetailDto>>> GetByOutletId(
        Guid outletId,
        CancellationToken cancellationToken = default)
    {
        var showroomOpenStock = await _showroomOpenStockService.GetByOutletIdAsync(outletId, cancellationToken);
        if (showroomOpenStock == null)
        {
            return NotFound(ApiResponse<ShowroomOpenStockDetailDto>.FailureResponse(
                Error.NotFound("ShowroomOpenStock for Outlet", outletId.ToString())));
        }

        return Ok(ApiResponse<ShowroomOpenStockDetailDto>.SuccessResponse(showroomOpenStock));
    }

    [HttpPost]
    [HasPermission("operation:showroom-open-stock:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ShowroomOpenStockDetailDto>>> Create(
        [FromBody] CreateShowroomOpenStockDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var showroomOpenStock = await _showroomOpenStockService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = showroomOpenStock.Id },
                ApiResponse<ShowroomOpenStockDetailDto>.SuccessResponse(showroomOpenStock));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ShowroomOpenStockDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:showroom-open-stock:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ShowroomOpenStockDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateShowroomOpenStockDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var showroomOpenStock = await _showroomOpenStockService.UpdateAsync(id, dto, userId, cancellationToken);

            if (showroomOpenStock == null)
            {
                return NotFound(ApiResponse<ShowroomOpenStockDetailDto>.FailureResponse(
                    Error.NotFound("ShowroomOpenStock", id.ToString())));
            }

            return Ok(ApiResponse<ShowroomOpenStockDetailDto>.SuccessResponse(showroomOpenStock));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ShowroomOpenStockDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:showroom-open-stock:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _showroomOpenStockService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("ShowroomOpenStock", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Showroom open stock deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
