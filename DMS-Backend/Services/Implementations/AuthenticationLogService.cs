using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class AuthenticationLogService : IAuthenticationLogService
{
    private readonly ApplicationDbContext _context;

    public AuthenticationLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogLoginSuccessAsync(string email, Guid userId, string? ipAddress, string? userAgent, string? sessionId = null)
    {
        await LogAsync("LoginSuccess", email, userId, null, ipAddress, userAgent, sessionId);
    }

    public async Task LogLoginFailureAsync(string email, string failureReason, string? ipAddress, string? userAgent)
    {
        await LogAsync("LoginFailed", email, null, failureReason, ipAddress, userAgent, null);
    }

    public async Task LogLogoutAsync(string email, Guid userId, string? ipAddress, string? userAgent, string? sessionId = null)
    {
        await LogAsync("Logout", email, userId, null, ipAddress, userAgent, sessionId);
    }

    public async Task LogTokenRefreshAsync(string email, Guid userId, string? ipAddress)
    {
        await LogAsync("TokenRefresh", email, userId, null, ipAddress, null, null);
    }

    private async Task LogAsync(string eventType, string email, Guid? userId, string? failureReason, string? ipAddress, string? userAgent, string? sessionId)
    {
        var log = new AuthenticationLog
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserId = userId,
            EventType = eventType,
            FailureReason = failureReason,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            SessionId = sessionId,
            Timestamp = DateTimeOffset.UtcNow
        };

        _context.AuthenticationLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
