namespace DMS_Backend.Services.Interfaces;

public interface IAuthenticationLogService
{
    Task LogLoginSuccessAsync(string email, Guid userId, string? ipAddress, string? userAgent, string? sessionId = null);
    Task LogLoginFailureAsync(string email, string failureReason, string? ipAddress, string? userAgent);
    Task LogLogoutAsync(string email, Guid userId, string? ipAddress, string? userAgent, string? sessionId = null);
    Task LogTokenRefreshAsync(string email, Guid userId, string? ipAddress);
}
