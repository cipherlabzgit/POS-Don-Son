using DMS_Backend.Models.DTOs.Auth;

namespace DMS_Backend.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<(string AccessToken, string RefreshToken, UserDto User)?> RefreshTokenAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default);
    Task LogoutAsync(string refreshToken, string? email, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(string email, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default);
}
