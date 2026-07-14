using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports/daily-sale-of-item")]
public sealed class DailySaleOfItemReportsController : ControllerBase
{
    private readonly IDailySaleOfItemReportService _reportService;

    public DailySaleOfItemReportsController(IDailySaleOfItemReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>Product search for report filter (report permissions; avoids requiring products:view).</summary>
    [HttpGet("products")]
    [HasPermission("reports:daily:view|reports:sales:view|reports:showroom:view|reports:view")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailySaleOfItemProductOptionDto>>>> SearchProducts(
        [FromQuery] string? search,
        [FromQuery] int take = 25,
        CancellationToken cancellationToken = default)
    {
        var list = await _reportService.SearchProductsAsync(search, take, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DailySaleOfItemProductOptionDto>>.SuccessResponse(list));
    }

    /// <summary>Daily totals for one item across a date range. format=json (default), pdf, or xlsx.</summary>
    [HttpGet]
    [HasPermission("reports:daily:view|reports:sales:view|reports:showroom:view|reports:view")]
    public async Task<IActionResult> GetReport(
        [FromQuery] Guid productId,
        [FromQuery] DateOnly fromDate,
        [FromQuery] DateOnly toDate,
        [FromQuery] string? format = "json",
        CancellationToken cancellationToken = default)
    {
        if (productId == Guid.Empty)
            return BadRequest(ApiResponse<DailySaleOfItemReportDto>.FailureResponse(Error.Validation("Item is required.")));

        try
        {
            var model = await _reportService.BuildReportAsync(productId, fromDate, toDate, User, cancellationToken);
            var f = (format ?? "json").Trim().ToLowerInvariant();
            var safeCode = string.IsNullOrWhiteSpace(model.ProductCode) ? "item" : model.ProductCode.Trim();
            foreach (var ch in Path.GetInvalidFileNameChars())
                safeCode = safeCode.Replace(ch, '-');

            if (f is "pdf")
            {
                var bytes = _reportService.RenderPdf(model);
                return File(
                    bytes,
                    "application/pdf",
                    $"daily-sale-of-item-{safeCode}-{fromDate:yyyy-MM-dd}-to-{toDate:yyyy-MM-dd}.pdf");
            }

            if (f is "xlsx" or "excel")
            {
                var bytes = _reportService.RenderExcel(model);
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"daily-sale-of-item-{safeCode}-{fromDate:yyyy-MM-dd}-to-{toDate:yyyy-MM-dd}.xlsx");
            }

            return Ok(ApiResponse<DailySaleOfItemReportDto>.SuccessResponse(model));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailySaleOfItemReportDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
