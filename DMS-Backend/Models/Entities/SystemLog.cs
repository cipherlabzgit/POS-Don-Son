using System.Text.Json;

namespace DMS_Backend.Models.Entities;

public sealed class SystemLog
{
    public Guid Id { get; set; }
    public string LogLevel { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public JsonDocument? AdditionalData { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
