namespace DMS_Backend.Services.Interfaces;

public interface IRefreshTokenService
{
    Task StoreRefreshTokenAsync(Guid userId, string refreshToken, int expiryDays);
    Task<Guid?> ValidateRefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
}
