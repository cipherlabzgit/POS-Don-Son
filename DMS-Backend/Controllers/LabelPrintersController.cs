using System.Security.Claims;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.LabelPrinters;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/label-printers")]
public sealed class LabelPrintersController : ControllerBase
{
    private readonly ILabelPrinterService _labelPrinterService;

    public LabelPrintersController(ILabelPrinterService labelPrinterService)
    {
        _labelPrinterService = labelPrinterService;
    }

    [HttpGet]
    [HasPermission("label-settings:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] bool activeOnly = false,
        CancellationToken cancellationToken = default)
    {
        var list = await _labelPrinterService.GetAllAsync(activeOnly, cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { Printers = list, TotalCount = list.Count }));
    }

    [HttpPost]
    [HasPermission("label-settings:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelPrinterListDto>>> Create(
        [FromBody] LabelPrinterCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var row = await _labelPrinterService.CreateAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<LabelPrinterListDto>.SuccessResponse(row));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrinterListDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("label-settings:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelPrinterListDto>>> Update(
        Guid id,
        [FromBody] LabelPrinterUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var row = await _labelPrinterService.UpdateAsync(id, dto, userId, cancellationToken);
            return Ok(ApiResponse<LabelPrinterListDto>.SuccessResponse(row));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(ApiResponse<LabelPrinterListDto>.FailureResponse(Error.NotFound("LabelPrinter", id.ToString())));
            }

            return BadRequest(ApiResponse<LabelPrinterListDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
