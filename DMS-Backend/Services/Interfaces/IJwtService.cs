using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user, List<string> permissions);
    string GenerateRefreshToken();
    Task StoreRefreshTokenAsync(Guid userId, string refreshToken, CancellationToken cancellationToken = default);
    Task<Guid?> ValidateRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
}
