using System.Security.Claims;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.SaleRecords;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/day-end")]
public sealed class SaleRecordsAdminController : ControllerBase
{
    private readonly ISaleRecordsService _saleRecordsService;

    public SaleRecordsAdminController(ISaleRecordsService saleRecordsService)
    {
        _saleRecordsService = saleRecordsService;
    }

    [HttpGet("sale-records-settings")]
    [HasPermission("day-end:view")]
    public async Task<ActionResult<ApiResponse<SaleRecordsSettingsDto>>> GetSettings(
        CancellationToken cancellationToken)
    {
        var dto = await _saleRecordsService.GetSettingsAsync(cancellationToken);
        return Ok(ApiResponse<SaleRecordsSettingsDto>.SuccessResponse(dto));
    }

    [HttpPut("sale-records-settings")]
    [HasPermission("day-end:edit")]
    public async Task<ActionResult<ApiResponse<SaleRecordsSettingsDto>>> UpdateSettings(
        [FromBody] UpdateSaleRecordsSettingsDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var updated = await _saleRecordsService.UpdateSettingsAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<SaleRecordsSettingsDto>.SuccessResponse(updated));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<SaleRecordsSettingsDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpGet("notify-targets")]
    [HasPermission("day-end:notify")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SaleRecordNotifyTargetDto>>>> GetNotifyTargets(
        [FromQuery] DateTime processDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var list = await _saleRecordsService.GetNotifyTargetsAsync(processDate, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<SaleRecordNotifyTargetDto>>.SuccessResponse(list));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<IReadOnlyList<SaleRecordNotifyTargetDto>>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("notify-cashiers")]
    [HasPermission("day-end:notify")]
    public async Task<ActionResult<ApiResponse<object>>> NotifyCashiers(
        [FromBody] NotifyCashiersDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _saleRecordsService.NotifyCashiersAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Cashiers notified." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
