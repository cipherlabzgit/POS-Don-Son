using System.Security.Claims;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.CashierBalance;
using DMS_Backend.Models.DTOs.DayEnd;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/cashier-balance")]
public sealed class CashierBalanceController : ControllerBase
{
    private readonly ICashierBalanceService _cashierBalanceService;

    public CashierBalanceController(ICashierBalanceService cashierBalanceService)
    {
        _cashierBalanceService = cashierBalanceService;
    }

    [HttpGet("context")]
    [HasPermission("cashier-balance:view")]
    public async Task<ActionResult<ApiResponse<CashierBalanceContextDto>>> GetContext(
        [FromQuery] DateTime? processDate,
        CancellationToken cancellationToken)
    {
        var date = processDate ?? DateTime.UtcNow.Date.AddDays(-1);
        var ctx = await _cashierBalanceService.GetContextAsync(date, cancellationToken);
        return Ok(ApiResponse<CashierBalanceContextDto>.SuccessResponse(ctx));
    }

    [HttpGet("outlets/{outletId:guid}/cashiers")]
    [HasPermission("cashier-balance:view")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DayEndCashierOptionDto>>>> GetCashiers(
        Guid outletId,
        CancellationToken cancellationToken)
    {
        var list = await _cashierBalanceService.GetCashiersForOutletAsync(outletId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DayEndCashierOptionDto>>.SuccessResponse(list));
    }

    [HttpPost("submit")]
    [HasPermission("cashier-balance:edit")]
    public async Task<ActionResult<ApiResponse<object>>> Submit(
        [FromBody] SubmitCashierBalanceDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _cashierBalanceService.SubmitAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Cashier balance submitted successfully." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpGet("recent")]
    [HasPermission("cashier-balance:view")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CashierBalanceRecentSubmissionDto>>>> GetRecent(
        [FromQuery] int? count,
        CancellationToken cancellationToken)
    {
        var list = await _cashierBalanceService.GetRecentSubmissionsAsync(count ?? 10, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CashierBalanceRecentSubmissionDto>>.SuccessResponse(list));
    }
}
