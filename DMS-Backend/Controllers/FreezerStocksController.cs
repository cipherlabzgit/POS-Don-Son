using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/freezer-stocks")]
public class FreezerStocksController : ControllerBase
{
    private readonly IFreezerStockService _freezerStockService;

    public FreezerStocksController(IFreezerStockService freezerStockService)
    {
        _freezerStockService = freezerStockService;
    }

    [HttpGet]
    [HasPermission("freezer_stock:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] Guid? productId = null,
        [FromQuery] Guid? productionSectionId = null,
        CancellationToken cancellationToken = default)
    {
        var (stocks, totalCount) = await _freezerStockService.GetAllAsync(
            page, pageSize, productId, productionSectionId, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            FreezerStocks = stocks,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("freezer_stock:view")]
    public async Task<ActionResult<ApiResponse<FreezerStockDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var stock = await _freezerStockService.GetByIdAsync(id, cancellationToken);
        if (stock == null)
        {
            return NotFound(ApiResponse<FreezerStockDetailDto>.FailureResponse(
                Error.NotFound("FreezerStock", id.ToString())));
        }

        return Ok(ApiResponse<FreezerStockDetailDto>.SuccessResponse(stock));
    }

    [HttpGet("current")]
    [HasPermission("freezer_stock:view")]
    public async Task<ActionResult<ApiResponse<FreezerStockDetailDto>>> GetCurrentStock(
        [FromQuery] Guid productId,
        [FromQuery] Guid productionSectionId,
        CancellationToken cancellationToken = default)
    {
        var stock = await _freezerStockService.GetCurrentStockAsync(
            productId, productionSectionId, cancellationToken);

        if (stock == null)
        {
            return NotFound(ApiResponse<FreezerStockDetailDto>.FailureResponse(
                Error.NotFound("FreezerStock", $"Product={productId}, Section={productionSectionId}")));
        }

        return Ok(ApiResponse<FreezerStockDetailDto>.SuccessResponse(stock));
    }

    [HttpPost("adjust")]
    [HasPermission("freezer_stock:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<FreezerStockDetailDto>>> AdjustStock(
        [FromBody] AdjustFreezerStockDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var stock = await _freezerStockService.AdjustStockAsync(dto, userId, cancellationToken);

            return Ok(ApiResponse<FreezerStockDetailDto>.SuccessResponse(stock));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<FreezerStockDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpGet("history")]
    [HasPermission("freezer_stock:view")]
    public async Task<ActionResult<ApiResponse<IEnumerable<FreezerStockHistoryDto>>>> GetHistory(
        [FromQuery] Guid productId,
        [FromQuery] Guid productionSectionId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var history = await _freezerStockService.GetHistoryAsync(
            productId, productionSectionId, fromDate, toDate, cancellationToken);

        return Ok(ApiResponse<IEnumerable<FreezerStockHistoryDto>>.SuccessResponse(history));
    }
}
