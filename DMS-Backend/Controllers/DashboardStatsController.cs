using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardStatsController : ControllerBase
{
    private readonly IDashboardStatsService _service;
    private readonly ILogger<DashboardStatsController> _logger;

    public DashboardStatsController(IDashboardStatsService service, ILogger<DashboardStatsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("sales-trend")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetSalesTrend([FromQuery] int days = 7, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _service.GetSalesTrendAsync(Math.Clamp(days, 1, 90), cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales trend");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve sales trend")));
        }
    }

    [HttpGet("disposal-by-section")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetDisposalBySection([FromQuery] DateTime? date = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date.AddDays(-1);
            var result = await _service.GetDisposalBySectionAsync(targetDate, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting disposal by section");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve disposal by section")));
        }
    }

    [HttpGet("top-deliveries")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetTopDeliveries([FromQuery] DateTime? date = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date;
            var result = await _service.GetTopDeliveriesAsync(targetDate, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top deliveries");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve top deliveries")));
        }
    }

    [HttpGet("delivery-vs-disposal")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetDeliveryVsDisposal([FromQuery] int days = 7, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _service.GetDeliveryVsDisposalAsync(Math.Clamp(days, 1, 90), cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery vs disposal");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve delivery vs disposal")));
        }
    }

    [HttpGet("section-production-totals")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetSectionProductionTotals(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date;
            var result = await _service.GetSectionProductionTotalsAsync(targetDate, deliveryTurnId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting section production totals");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve section production totals")));
        }
    }

    [HttpGet("ingredient-stock-alerts")]
    [HasPermission("dashboard:view")]
    public async Task<IActionResult> GetIngredientStockAlerts(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _service.GetIngredientStockAlertsAsync(cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ingredient stock alerts");
            return StatusCode(500, ApiResponse<object>.FailureResponse(Error.Internal("Failed to retrieve ingredient stock alerts")));
        }
    }
}
