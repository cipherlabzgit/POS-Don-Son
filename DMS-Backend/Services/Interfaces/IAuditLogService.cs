namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Service for logging entity changes to audit_logs table
/// </summary>
public interface IAuditLogService
{
    Task LogChangeAsync(
        Guid? userId,
        string? email,
        string eventType,
        string? entityType,
        string? entityId,
        string? action,
        object? oldValues,
        object? newValues,
        string? ipAddress = null,
        string? userAgent = null,
        string? requestPath = null,
        string? requestMethod = null,
        int? statusCode = null,
        string? errorMessage = null,
        CancellationToken cancellationToken = default);

    Task LogEntityCreatedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object newValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default);

    Task LogEntityUpdatedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object oldValues,
        object newValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default);

    Task LogEntityDeletedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object oldValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default);
}
