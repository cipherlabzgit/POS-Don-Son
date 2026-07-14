using System.Text.Json;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class SystemLogService : ISystemLogService
{
    private readonly ApplicationDbContext _context;

    public SystemLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogInfoAsync(string category, string message, object? additionalData = null)
    {
        await LogAsync("Info", category, message, null, additionalData);
    }

    public async Task LogWarningAsync(string category, string message, object? additionalData = null)
    {
        await LogAsync("Warning", category, message, null, additionalData);
    }

    public async Task LogErrorAsync(string category, string message, Exception? exception = null, object? additionalData = null)
    {
        await LogAsync("Error", category, message, exception, additionalData);
    }

    public async Task LogCriticalAsync(string category, string message, Exception? exception = null, object? additionalData = null)
    {
        await LogAsync("Critical", category, message, exception, additionalData);
    }

    private async Task LogAsync(string logLevel, string category, string message, Exception? exception, object? additionalData)
    {
        var log = new SystemLog
        {
            Id = Guid.NewGuid(),
            LogLevel = logLevel,
            Category = category,
            Message = message,
            Exception = exception?.ToString(),
            AdditionalData = additionalData != null 
                ? JsonDocument.Parse(JsonSerializer.Serialize(additionalData))
                : null,
            Timestamp = DateTimeOffset.UtcNow
        };

        _context.SystemLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
