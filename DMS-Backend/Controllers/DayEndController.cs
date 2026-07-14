using System.Security.Claims;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DayEnd;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/day-end")]
public sealed class DayEndController : ControllerBase
{
    private readonly IDayEndService _dayEndService;

    public DayEndController(IDayEndService dayEndService)
    {
        _dayEndService = dayEndService;
    }

    [HttpGet("context")]
    [HasPermission("day-end:view")]
    public async Task<ActionResult<ApiResponse<DayEndContextDto>>> GetContext(
        [FromQuery] DateTime? processDate,
        CancellationToken cancellationToken)
    {
        var date = processDate ?? DateTime.UtcNow.Date.AddDays(-1);
        var ctx = await _dayEndService.GetContextAsync(date, cancellationToken);
        return Ok(ApiResponse<DayEndContextDto>.SuccessResponse(ctx));
    }

    [HttpGet("outlets/{outletId:guid}/cashiers")]
    [HasPermission("day-end:view")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DayEndCashierOptionDto>>>> GetCashiers(
        Guid outletId,
        CancellationToken cancellationToken)
    {
        var list = await _dayEndService.GetCashiersForOutletAsync(outletId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DayEndCashierOptionDto>>.SuccessResponse(list));
    }

    [HttpPost("cashier-balance/approve")]
    [HasPermission("cashier-balance:edit")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveCashierBalance(
        [FromQuery] DateTime processDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _dayEndService.ApproveCashierBalanceForDateAsync(processDate, userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Cashier balance approved for this date." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("submit")]
    [HasPermission("day-end:execute")]
    public async Task<ActionResult<ApiResponse<object>>> Submit(
        [FromBody] SubmitDayEndDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _dayEndService.SubmitDayEndAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Day-End Process submitted successfully." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
