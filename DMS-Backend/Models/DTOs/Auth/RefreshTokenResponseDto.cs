namespace DMS_Backend.Models.DTOs.Auth;

public sealed class RefreshTokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public int ExpiresIn { get; set; }
}
