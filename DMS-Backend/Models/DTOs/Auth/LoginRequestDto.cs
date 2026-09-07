using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Auth;

public sealed class LoginRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// <c>pos</c> or <c>dms</c>. POS accepts Cashier only; DMS rejects cashier-only accounts.
    /// </summary>
    public string? Client { get; set; }
}
