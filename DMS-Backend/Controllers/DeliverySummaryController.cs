using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/delivery-summary")]
[Authorize]
public class DeliverySummaryController : ControllerBase
{
    private readonly IDeliverySummaryService _deliverySummaryService;
    private readonly ILogger<DeliverySummaryController> _logger;

    public DeliverySummaryController(
        IDeliverySummaryService deliverySummaryService,
        ILogger<DeliverySummaryController> logger)
    {
        _deliverySummaryService = deliverySummaryService;
        _logger = logger;
    }

    [HttpGet]
    [HasPermission("delivery-summary:view")]
    public async Task<IActionResult> GetDeliverySummary(
        [FromQuery] DateTime date,
        [FromQuery] Guid deliveryTurnId,
        [FromQuery] string context = "production",
        CancellationToken cancellationToken = default)
    {
        if (context != "production" && context != "stores")
            return BadRequest(new { message = "context must be 'production' or 'stores'" });

        try
        {
            var summary = await _deliverySummaryService.GetDeliverySummaryAsync(date, deliveryTurnId, context, cancellationToken);

            if (summary == null)
            {
                return NotFound(new { message = "Delivery plan not found for the specified date and turn" });
            }

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery summary for date {Date} and turn {DeliveryTurnId}", date, deliveryTurnId);
            return StatusCode(500, new { message = "An error occurred while retrieving delivery summary" });
        }
    }
}
