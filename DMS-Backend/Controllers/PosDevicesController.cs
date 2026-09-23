using System.Security.Claims;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/pos-devices")]
public sealed class PosDevicesController : ControllerBase
{
    private readonly IPosDeviceAgentService _agents;

    public PosDevicesController(IPosDeviceAgentService agents) => _agents = agents;

    [HttpPost("heartbeat")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PosDeviceStatusDto>>> Heartbeat(
        [FromBody] PosDeviceHeartbeatDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var status = await _agents.HeartbeatAsync(dto, ip, cancellationToken);
            return Ok(ApiResponse<PosDeviceStatusDto>.SuccessResponse(status));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PosDeviceStatusDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PosDevicePresenceDto>>> GetStatus(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<PosDevicePresenceDto>.FailureResponse(Error.Forbidden("Super Admin only.")));
        return Ok(ApiResponse<PosDevicePresenceDto>.SuccessResponse(await _agents.GetPresenceAsync(cancellationToken)));
    }

    [HttpPost("{id:guid}/refresh")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> RefreshDevice(Guid id, CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        try
        {
            await _agents.QueueRefreshAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Refresh queued." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("refresh-all")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> RefreshAll(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _agents.QueueRefreshAllAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "Refresh queued for all POS devices." }));
    }

    private bool IsSuperAdmin() =>
        string.Equals(User.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
}
