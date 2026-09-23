using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Implementations;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Controllers;

/// <summary>
/// DN Print Client presence (heartbeat) + portal Online/Offline status.
/// </summary>
[ApiController]
[Route("api/dn-print-agents")]
public sealed class DnPrintAgentsController : ControllerBase
{
    private readonly IDnPrintAgentService _agents;
    private readonly ApplicationDbContext _context;

    public DnPrintAgentsController(IDnPrintAgentService agents, ApplicationDbContext context)
    {
        _agents = agents;
        _context = context;
    }

    /// <summary>WPF client calls this every few seconds while polling.</summary>
    [HttpPost("heartbeat")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DnPrintAgentStatusDto>>> Heartbeat(
        [FromBody] DnPrintHeartbeatDto dto,
        CancellationToken cancellationToken)
    {
        if (!await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken))
            return Unauthorized(ApiResponse<DnPrintAgentStatusDto>.FailureResponse(
                Error.Unauthorized("Invalid or missing DN Print Client key.")));

        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var status = await _agents.HeartbeatAsync(dto, ip, cancellationToken);
            return Ok(ApiResponse<DnPrintAgentStatusDto>.SuccessResponse(status));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DnPrintAgentStatusDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    /// <summary>Web portal polls this to show DN Print Online / Offline.</summary>
    [HttpGet("status")]
    [Authorize]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<DnPrintPresenceDto>>> GetStatus(
        CancellationToken cancellationToken)
    {
        var presence = await _agents.GetPresenceAsync(cancellationToken);
        return Ok(ApiResponse<DnPrintPresenceDto>.SuccessResponse(presence));
    }
}

/// <summary>Shared client-key check for DN Print agent endpoints.</summary>
internal static class DnPrintClientAuth
{
    public static async Task<bool> ValidateClientKeyAsync(
        ApplicationDbContext context,
        HttpRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.Headers.TryGetValue(DnPrintJobsController.ClientKeyHeader, out var provided)
            || string.IsNullOrWhiteSpace(provided))
            return false;

        var key = provided.ToString().Trim();
        var existing = await context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey == DnPrintJobService.ClientKeySettingName, cancellationToken);

        if (existing == null)
        {
            context.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid(),
                SettingKey = DnPrintJobService.ClientKeySettingName,
                SettingName = "DN Print Client Key",
                SettingValue = key,
                Description = "Shared secret for WPF DN Print Client (X-DN-Print-Client-Key)",
                Category = "Printing",
                SettingType = "String",
                IsSystemSetting = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
            });
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }

        return string.Equals(existing.SettingValue?.Trim(), key, StringComparison.Ordinal);
    }
}
