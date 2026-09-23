using System.Security.Claims;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/developer")]
[Authorize]
public sealed class DeveloperModeController : ControllerBase
{
    private readonly IDnPrintAgentService _dn;
    private readonly ILabelPrintAgentService _label;
    private readonly IPosDeviceAgentService _pos;

    public DeveloperModeController(
        IDnPrintAgentService dn,
        ILabelPrintAgentService label,
        IPosDeviceAgentService pos)
    {
        _dn = dn;
        _label = label;
        _pos = pos;
    }

    private bool IsSuperAdmin() =>
        string.Equals(User.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<object>>> Overview(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));

        var dn = await _dn.GetPresenceAsync(cancellationToken);
        var label = await _label.GetPresenceAsync(cancellationToken);
        var pos = await _pos.GetPresenceAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DnPrint = dn,
            LabelPrint = label,
            PosDevices = pos,
        }));
    }

    [HttpPost("dn-print/check")]
    public async Task<ActionResult<ApiResponse<object>>> CheckDn(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _dn.QueueCommandAsync(RemoteClientCommand.Check, cancellationToken);
        var presence = await _dn.GetPresenceAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "DN Print check queued.", presence }));
    }

    [HttpPost("dn-print/restart")]
    public async Task<ActionResult<ApiResponse<object>>> RestartDn(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _dn.QueueCommandAsync(RemoteClientCommand.Restart, cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "DN Print restart queued." }));
    }

    [HttpPost("label-print/check")]
    public async Task<ActionResult<ApiResponse<object>>> CheckLabel(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _label.QueueCommandAsync(RemoteClientCommand.Check, cancellationToken);
        var presence = await _label.GetPresenceAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "Label Print check queued.", presence }));
    }

    [HttpPost("label-print/restart")]
    public async Task<ActionResult<ApiResponse<object>>> RestartLabel(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _label.QueueCommandAsync(RemoteClientCommand.Restart, cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "Label Print restart queued." }));
    }

    [HttpPost("pos/refresh-all")]
    public async Task<ActionResult<ApiResponse<object>>> RefreshAllPos(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(Error.Forbidden("Super Admin only.")));
        await _pos.QueueRefreshAllAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { message = "POS refresh queued for all devices." }));
    }

    [HttpPost("pos/refresh-status")]
    public async Task<ActionResult<ApiResponse<PosDevicePresenceDto>>> RefreshPosStatus(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<PosDevicePresenceDto>.FailureResponse(Error.Forbidden("Super Admin only.")));
        var presence = await _pos.GetPresenceAsync(cancellationToken);
        return Ok(ApiResponse<PosDevicePresenceDto>.SuccessResponse(presence));
    }
}
