using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports/daily-sales-system-balance")]
public sealed class DailySalesSystemBalanceReportsController : ControllerBase
{
    private readonly IDailySalesSystemBalanceReportService _reportService;

    public DailySalesSystemBalanceReportsController(IDailySalesSystemBalanceReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Item-wise approved POS totals for a calendar date (system balance). format=json (default), pdf, or xlsx.
    /// </summary>
    [HttpGet]
    [HasPermission("reports:daily:view|reports:sales:view|reports:view")]
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
                return File(bytes, "application/pdf", $"daily-sales-system-balance-{reportDate:yyyy-MM-dd}.pdf");
            }

            if (f is "xlsx" or "excel")
            {
                var bytes = _reportService.RenderExcel(model);
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"daily-sales-system-balance-{reportDate:yyyy-MM-dd}.xlsx");
            }

            return Ok(ApiResponse<DailySalesSystemBalanceReportDto>.SuccessResponse(model));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailySalesSystemBalanceReportDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
