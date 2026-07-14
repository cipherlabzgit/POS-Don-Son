using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.CurrentStock;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/current-stock")]
public class CurrentStockController : ControllerBase
{
    private readonly ICurrentStockService _currentStockService;

    public CurrentStockController(ICurrentStockService currentStockService)
    {
        _currentStockService = currentStockService;
    }

    [HttpGet]
    [HasPermission("production:current-stock:view")]
    public async Task<ActionResult<ApiResponse<List<CurrentStockDto>>>> GetAll(
        [FromQuery] DateTime? forDate = null,
        CancellationToken cancellationToken = default)
    {
        var currentStock = await _currentStockService.GetAllAsync(forDate, cancellationToken);
        return Ok(ApiResponse<List<CurrentStockDto>>.SuccessResponse(currentStock));
    }

    [HttpGet("{productId:guid}")]
    [HasPermission("production:current-stock:view")]
    public async Task<ActionResult<ApiResponse<CurrentStockDto>>> GetByProductId(
        Guid productId,
        [FromQuery] DateTime? forDate = null,
        CancellationToken cancellationToken = default)
    {
        var currentStock = await _currentStockService.GetByProductIdAsync(productId, forDate, cancellationToken);
        
        if (currentStock == null)
        {
            return NotFound(ApiResponse<CurrentStockDto>.FailureResponse(
                Error.NotFound("CurrentStock", productId.ToString())));
        }

        return Ok(ApiResponse<CurrentStockDto>.SuccessResponse(currentStock));
    }
}
