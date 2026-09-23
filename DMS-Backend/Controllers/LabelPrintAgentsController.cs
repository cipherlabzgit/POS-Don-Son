using System.Security.Claims;
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

[ApiController]
[Route("api/label-print-agents")]
public sealed class LabelPrintAgentsController : ControllerBase
{
    private readonly ILabelPrintAgentService _agents;
    private readonly ApplicationDbContext _context;

    public LabelPrintAgentsController(ILabelPrintAgentService agents, ApplicationDbContext context)
    {
        _agents = agents;
        _context = context;
    }

    [HttpPost("heartbeat")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DnPrintAgentStatusDto>>> Heartbeat(
        [FromBody] LabelPrintHeartbeatDto dto,
        CancellationToken cancellationToken)
    {
        if (!await ValidateLabelKeyAsync(cancellationToken))
            return Unauthorized(ApiResponse<DnPrintAgentStatusDto>.FailureResponse(
                Error.Unauthorized("Invalid or missing Label Print Client key.")));

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

    [HttpGet("status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<DnPrintPresenceDto>>> GetStatus(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<DnPrintPresenceDto>.FailureResponse(Error.Forbidden("Super Admin only.")));
        return Ok(ApiResponse<DnPrintPresenceDto>.SuccessResponse(await _agents.GetPresenceAsync(cancellationToken)));
    }

    private bool IsSuperAdmin() =>
        string.Equals(User.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

    private async Task<bool> ValidateLabelKeyAsync(CancellationToken cancellationToken)
    {
        const string header = "X-Label-Print-Client-Key";
        if (!Request.Headers.TryGetValue(header, out var provided) || string.IsNullOrWhiteSpace(provided))
            return await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken);

        var key = provided.ToString().Trim();
        var existing = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey == ILabelPrintAgentService.ClientKeySettingName, cancellationToken);
        if (existing == null)
        {
            _context.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid(),
                SettingKey = ILabelPrintAgentService.ClientKeySettingName,
                SettingName = "Label Print Client Key",
                SettingValue = key,
                Category = "Printing",
                SettingType = "String",
                IsSystemSetting = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
            });
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        return string.Equals(existing.SettingValue?.Trim(), key, StringComparison.Ordinal);
    }
}
