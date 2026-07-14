using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Auth;

public sealed class ResetPasswordRequestDto
{
    [Required(ErrorMessage = "Reset token is required")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "New password must be at least 8 characters")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
