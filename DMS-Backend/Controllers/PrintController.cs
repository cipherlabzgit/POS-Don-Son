using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/print")]
[Authorize]
public class PrintController : ControllerBase
{
    private readonly IPrintService _printService;
    private readonly ILogger<PrintController> _logger;

    public PrintController(
        IPrintService printService,
        ILogger<PrintController> logger)
    {
        _printService = printService;
        _logger = logger;
    }

    [HttpGet("receipt-cards")]
    [HasPermission("print:receipt-cards")]
    public async Task<IActionResult> GetReceiptCard(
        [FromQuery] Guid deliveryPlanId,
        [FromQuery] Guid outletId,
        CancellationToken cancellationToken)
    {
        try
        {
            var receiptCard = await _printService.GetReceiptCardAsync(deliveryPlanId, outletId, cancellationToken);

            if (receiptCard == null)
            {
                return NotFound(new { message = "Receipt card data not found" });
            }

            return Ok(receiptCard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting receipt card for delivery plan {DeliveryPlanId} and outlet {OutletId}", deliveryPlanId, outletId);
            return StatusCode(500, new { message = "An error occurred while retrieving receipt card" });
        }
    }

    [HttpGet("section-bundle")]
    [HasPermission("print:section-bundle")]
    public async Task<IActionResult> GetSectionBundle(
        [FromQuery] Guid productionPlanId,
        [FromQuery] Guid sectionId,
        CancellationToken cancellationToken)
    {
        try
        {
            var sectionBundle = await _printService.GetSectionBundleAsync(productionPlanId, sectionId, cancellationToken);

            if (sectionBundle == null)
            {
                return NotFound(new { message = "Section bundle data not found" });
            }

            return Ok(sectionBundle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting section bundle for production plan {ProductionPlanId} and section {SectionId}", productionPlanId, sectionId);
            return StatusCode(500, new { message = "An error occurred while retrieving section bundle" });
        }
    }
}
