using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Users;

public sealed class AdminResetPasswordDto
{
    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public string NewPassword { get; set; } = string.Empty;
}
