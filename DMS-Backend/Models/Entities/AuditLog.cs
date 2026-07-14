using System.Text.Json;

namespace DMS_Backend.Models.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Action { get; set; }
    public JsonDocument? OldValues { get; set; }
    public JsonDocument? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public int? StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
