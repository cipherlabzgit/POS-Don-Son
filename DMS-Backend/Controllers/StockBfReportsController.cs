using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/reports/stock-bf")]
public sealed class StockBfReportsController : ControllerBase
{
    private readonly IStockBfReportService _reportService;

    public StockBfReportsController(IStockBfReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Stock BF quantities by item and showroom for a BF date. format=json (default), pdf, or xlsx.
    /// </summary>
    [HttpGet]
    [HasPermission("reports:daily:view|reports:sales:view|reports:showroom:view|reports:inventory:view|reports:view")]
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
                return File(bytes, "application/pdf", $"stock-bf-{reportDate:yyyy-MM-dd}.pdf");
            }

            if (f is "xlsx" or "excel")
            {
                var bytes = _reportService.RenderExcel(model);
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"stock-bf-{reportDate:yyyy-MM-dd}.xlsx");
            }

            return Ok(ApiResponse<StockBfReportDto>.SuccessResponse(model));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockBfReportDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
