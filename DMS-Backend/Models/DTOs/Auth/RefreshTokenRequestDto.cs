using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Auth;

public sealed class RefreshTokenRequestDto
{
    [Required(ErrorMessage = "Refresh token is required")]
    public string RefreshToken { get; set; } = string.Empty;
}
