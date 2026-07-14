using System.Text.Json;

namespace DMS_Backend.Models.Entities;

public sealed class ApiRequestLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string? QueryString { get; set; }
    public JsonDocument? RequestBody { get; set; }
    public int? ResponseStatusCode { get; set; }
    public int? ResponseTimeMs { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsSuccessful { get; set; } = true;
    public string? ErrorMessage { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
