using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Auth;

public sealed class ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;
}
