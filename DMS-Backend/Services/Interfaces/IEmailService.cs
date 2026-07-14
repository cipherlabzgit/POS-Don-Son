namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Email service interface for sending emails
/// </summary>
public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default);
    Task SendPasswordChangedNotificationAsync(string toEmail, CancellationToken cancellationToken = default);
}
