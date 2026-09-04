using System.Security.Claims;
using System.Security.Cryptography;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/pos-backstage")]
public sealed class PosBackstageController : ControllerBase
{
    public const string CurrentKeyName = "POS_BACKSTAGE_ADMIN_KEY";
    public const string NextKeyName = "POS_BACKSTAGE_ADMIN_KEY_NEXT";

    private readonly ApplicationDbContext _context;

    public PosBackstageController(ApplicationDbContext context)
    {
        _context = context;
    }

    private bool IsSuperAdmin() =>
        string.Equals(User.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

    [HttpGet("key")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetKey(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(
                Error.Forbidden("Only a Super Admin can view the POS admin key.")));

        var pair = await EnsureKeyPairAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            pair.Current,
            pair.Next,
            UpdatedAt = pair.UpdatedAt,
        }));
    }

    [HttpPost("generate-next")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GenerateNext(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(
                Error.Forbidden("Only a Super Admin can generate the next POS admin key.")));

        var pair = await EnsureKeyPairAsync(cancellationToken);
        pair.Next = GenerateKey();
        await UpsertSettingAsync(NextKeyName, "POS Hidden Admin Key (next)", pair.Next, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            pair.Current,
            pair.Next,
        }));
    }

    [HttpPost("activate-next")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> ActivateNext(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin())
            return StatusCode(403, ApiResponse<object>.FailureResponse(
                Error.Forbidden("Only a Super Admin can activate the next POS admin key.")));

        var pair = await RotateCurrentToNextAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            pair.Current,
            pair.Next,
        }));
    }

    [HttpPost("verify")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> Verify(
        [FromBody] PosBackstageKeyDto body,
        CancellationToken cancellationToken)
    {
        var attempt = (body.Key ?? "").Trim();
        var pair = await EnsureKeyPairAsync(cancellationToken);
        if (attempt.Length == 0 || !string.Equals(attempt, pair.Current, StringComparison.Ordinal))
            return Unauthorized(ApiResponse<object>.FailureResponse(
                Error.Unauthorized("Invalid verification key.")));

        // One POS app per current key: consume it and load Next into Current.
        await RotateCurrentToNextAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { Ok = true, Rotated = true }));
    }

    private async Task<(string Current, string Next)> RotateCurrentToNextAsync(CancellationToken cancellationToken)
    {
        var pair = await EnsureKeyPairAsync(cancellationToken);
        var promoted = string.IsNullOrWhiteSpace(pair.Next) ? GenerateKey() : pair.Next;
        pair.Current = promoted;
        pair.Next = GenerateKey();
        await UpsertSettingAsync(CurrentKeyName, "POS Hidden Admin Key", pair.Current, cancellationToken);
        await UpsertSettingAsync(NextKeyName, "POS Hidden Admin Key (next)", pair.Next, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return (pair.Current, pair.Next);
    }

    private async Task<(string Current, string Next, DateTimeOffset? UpdatedAt)> EnsureKeyPairAsync(
        CancellationToken cancellationToken)
    {
        var currentRow = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey == CurrentKeyName, cancellationToken);
        var nextRow = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey == NextKeyName, cancellationToken);

        var current = (currentRow?.SettingValue ?? "").Trim();
        if (string.IsNullOrEmpty(current))
        {
            current = "Don&son2026#";
            await UpsertSettingAsync(CurrentKeyName, "POS Hidden Admin Key", current, cancellationToken);
        }

        var next = (nextRow?.SettingValue ?? "").Trim();
        if (string.IsNullOrEmpty(next))
        {
            next = GenerateKey();
            await UpsertSettingAsync(NextKeyName, "POS Hidden Admin Key (next)", next, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return (current, next, currentRow?.UpdatedAt);
    }

    private async Task UpsertSettingAsync(string key, string name, string value, CancellationToken cancellationToken)
    {
        var row = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key, cancellationToken);
        var now = DateTime.UtcNow;
        if (row == null)
        {
            _context.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid(),
                SettingKey = key,
                SettingName = name,
                SettingValue = value,
                SettingType = "String",
                Description = "POS Ctrl+Shift+A Verification Admin Key. Super Admin only.",
                Category = "POS",
                IsSystemSetting = true,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
            return;
        }

        row.SettingValue = value;
        row.UpdatedAt = now;
    }

    private static string GenerateKey()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        Span<char> body = stackalloc char[8];
        var bytes = RandomNumberGenerator.GetBytes(8);
        for (var i = 0; i < body.Length; i++)
            body[i] = alphabet[bytes[i] % alphabet.Length];
        return $"Don&son-{new string(body)}#";
    }
}

public sealed class PosBackstageKeyDto
{
    public string? Key { get; set; }
}
