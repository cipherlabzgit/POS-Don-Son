namespace DMS_Backend.Services.Interfaces;

public interface ISystemLogService
{
    Task LogInfoAsync(string category, string message, object? additionalData = null);
    Task LogWarningAsync(string category, string message, object? additionalData = null);
    Task LogErrorAsync(string category, string message, Exception? exception = null, object? additionalData = null);
    Task LogCriticalAsync(string category, string message, Exception? exception = null, object? additionalData = null);
}
