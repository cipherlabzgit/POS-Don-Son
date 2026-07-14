using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports/sales-summary")]
public sealed class SalesSummaryReportsController : ControllerBase
{
    private readonly ISalesSummaryReportService _reportService;

    public SalesSummaryReportsController(ISalesSummaryReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Per-showroom cashier balance vs approved POS totals for a calendar date. format=json (default), pdf, or xlsx.
    /// </summary>
    [HttpGet]
    [HasPermission("reports:sales:view|reports:view")]
    public async Task<IActionResult> GetReport(
        [FromQuery] DateOnly reportDate,
        [FromQuery] string? format = "json",
        CancellationToken cancellationToken = default)
    {
        try
        {
            var model = await _reportService.BuildReportAsync(reportDate, User, cancellationToken);
            var f = (format ?? "json").Trim().ToLowerInvariant();

            if (f is "pdf")
            {
                var bytes = _reportService.RenderPdf(model);
                return File(bytes, "application/pdf", $"sales-summary-{reportDate:yyyy-MM-dd}.pdf");
            }

            if (f is "xlsx" or "excel")
            {
                var bytes = _reportService.RenderExcel(model);
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"sales-summary-{reportDate:yyyy-MM-dd}.xlsx");
            }

            return Ok(ApiResponse<SalesSummaryReportDto>.SuccessResponse(model));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<SalesSummaryReportDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
