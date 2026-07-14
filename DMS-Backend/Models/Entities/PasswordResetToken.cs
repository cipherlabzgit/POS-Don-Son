namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a password reset token for forgot-password flow
/// </summary>
public sealed class PasswordResetToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UsedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
