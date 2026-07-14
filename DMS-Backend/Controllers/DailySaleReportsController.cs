using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports/daily-sale")]
public sealed class DailySaleReportsController : ControllerBase
{
    private readonly IDailySaleReportService _reportService;

    public DailySaleReportsController(IDailySaleReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Active showrooms for the report filter. Uses report permissions (users may not have <c>showroom:view</c>).
    /// </summary>
    [HttpGet("showrooms")]
    [HasPermission("reports:daily:view|reports:sales:view|reports:showroom:view|reports:view")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailySaleReportShowroomOptionDto>>>> GetShowrooms(
        CancellationToken cancellationToken = default)
    {
        var list = await _reportService.ListActiveShowroomsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DailySaleReportShowroomOptionDto>>.SuccessResponse(list));
    }

    /// <summary>
    /// Item-wise approved POS totals for one showroom and calendar date. format=json (default), pdf, or xlsx.
    /// </summary>
    [HttpGet]
    [HasPermission("reports:daily:view|reports:sales:view|reports:showroom:view|reports:view")]
    public async Task<IActionResult> GetReport(
        [FromQuery] Guid outletId,
        [FromQuery] DateOnly reportDate,
        [FromQuery] string? format = "json",
        CancellationToken cancellationToken = default)
    {
        if (outletId == Guid.Empty)
            return BadRequest(ApiResponse<DailySaleReportDto>.FailureResponse(Error.Validation("Showroom is required.")));

        try
        {
            var model = await _reportService.BuildReportAsync(outletId, reportDate, User, cancellationToken);
            var f = (format ?? "json").Trim().ToLowerInvariant();
            var safeCode = string.IsNullOrWhiteSpace(model.OutletCode) ? "showroom" : model.OutletCode.Trim();
            foreach (var ch in Path.GetInvalidFileNameChars())
                safeCode = safeCode.Replace(ch, '-');

            if (f is "pdf")
            {
                var bytes = _reportService.RenderPdf(model);
                return File(bytes, "application/pdf", $"daily-sale-{safeCode}-{reportDate:yyyy-MM-dd}.pdf");
            }

            if (f is "xlsx" or "excel")
            {
                var bytes = _reportService.RenderExcel(model);
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"daily-sale-{safeCode}-{reportDate:yyyy-MM-dd}.xlsx");
            }

            return Ok(ApiResponse<DailySaleReportDto>.SuccessResponse(model));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailySaleReportDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
