using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

/// <summary>
/// Stub email service for development - logs to console instead of sending real emails
/// </summary>
public sealed class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
        var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";

        _logger.LogInformation("=== PASSWORD RESET EMAIL (DEV MODE) ===");
        _logger.LogInformation("To: {Email}", toEmail);
        _logger.LogInformation("Subject: Reset Your Password - Don & Sons DMS");
        _logger.LogInformation("Reset Link: {ResetLink}", resetLink);
        _logger.LogInformation("Token: {Token}", resetToken);
        _logger.LogInformation("This link expires in 1 hour.");
        _logger.LogInformation("========================================");

        // In production, replace with actual email sending (SendGrid, SMTP, etc.)
        return Task.CompletedTask;
    }

    public Task SendPasswordChangedNotificationAsync(string toEmail, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=== PASSWORD CHANGED NOTIFICATION (DEV MODE) ===");
        _logger.LogInformation("To: {Email}", toEmail);
        _logger.LogInformation("Subject: Password Changed - Don & Sons DMS");
        _logger.LogInformation("Your password has been successfully changed.");
        _logger.LogInformation("If you did not make this change, please contact support immediately.");
        _logger.LogInformation("================================================");

        // In production, replace with actual email sending
        return Task.CompletedTask;
    }
}
