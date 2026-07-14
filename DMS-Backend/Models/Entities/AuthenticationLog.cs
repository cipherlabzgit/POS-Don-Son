namespace DMS_Backend.Models.Entities;

public sealed class AuthenticationLog
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? SessionId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
