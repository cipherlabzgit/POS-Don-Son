using System.Collections.Concurrent;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

/// <summary>
/// In-memory refresh token storage for development without Redis.
/// WARNING: Tokens will be lost on server restart. Use Redis in production.
/// </summary>
public sealed class InMemoryRefreshTokenService : IRefreshTokenService
{
    private readonly ConcurrentDictionary<string, (Guid UserId, DateTimeOffset ExpiresAt)> _tokens = new();

    public Task StoreRefreshTokenAsync(Guid userId, string refreshToken, int expiryDays)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddDays(expiryDays);
        _tokens[refreshToken] = (userId, expiresAt);
        
        // Clean up expired tokens periodically
        CleanupExpiredTokens();
        
        return Task.CompletedTask;
    }

    public Task<Guid?> ValidateRefreshTokenAsync(string refreshToken)
    {
        if (_tokens.TryGetValue(refreshToken, out var tokenData))
        {
            if (tokenData.ExpiresAt > DateTimeOffset.UtcNow)
            {
                return Task.FromResult<Guid?>(tokenData.UserId);
            }
            
            // Token expired, remove it
            _tokens.TryRemove(refreshToken, out _);
        }
        
        return Task.FromResult<Guid?>(null);
    }

    public Task RevokeRefreshTokenAsync(string refreshToken)
    {
        _tokens.TryRemove(refreshToken, out _);
        return Task.CompletedTask;
    }

    private void CleanupExpiredTokens()
    {
        var now = DateTimeOffset.UtcNow;
        var expiredTokens = _tokens
            .Where(kvp => kvp.Value.ExpiresAt <= now)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var token in expiredTokens)
        {
            _tokens.TryRemove(token, out _);
        }
    }
}
