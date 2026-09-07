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
[Route("api/pos/sale-records")]
public sealed class PosSaleRecordsController : ControllerBase
{
    private readonly ISaleRecordsService _saleRecordsService;

    public PosSaleRecordsController(ISaleRecordsService saleRecordsService)
    {
        _saleRecordsService = saleRecordsService;
    }

    [HttpGet]
    [HasPermission("pos:sale-records:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<PosSaleRecordsDto>>> Get(
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var dto = await _saleRecordsService.GetPosRecordsAsync(userId, cancellationToken);
        return Ok(ApiResponse<PosSaleRecordsDto>.SuccessResponse(dto));
    }

    [HttpGet("unread-count")]
    [HasPermission("pos:sale-records:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<PosSaleRecordsUnreadDto>>> UnreadCount(
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var dto = await _saleRecordsService.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(ApiResponse<PosSaleRecordsUnreadDto>.SuccessResponse(dto));
    }

    [HttpPost("mark-read")]
    [HasPermission("pos:sale-records:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<object>>> MarkRead(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _saleRecordsService.MarkReadAsync(userId, cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Sale records marked as read." }));
    }
}
