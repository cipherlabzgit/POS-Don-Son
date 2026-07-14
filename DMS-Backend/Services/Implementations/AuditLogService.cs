using System.Text.Json;
using System.Text.Json.Serialization;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class AuditLogService : IAuditLogService
{
    private static readonly JsonSerializerOptions _serializerOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        MaxDepth = 5,
    };

    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static JsonDocument? SafeSerialize(object? value, ILogger logger)
    {
        if (value is null) return null;
        try
        {
            return JsonDocument.Parse(JsonSerializer.Serialize(value, _serializerOptions));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AuditLog: could not serialize value of type {Type}, storing type name only", value.GetType().Name);
            return JsonDocument.Parse($"{{\"_serializationError\":\"{value.GetType().Name}\"}}");
        }
    }

    public async Task LogChangeAsync(
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
        CancellationToken cancellationToken = default)
    {
        try
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                Email = email,
                EventType = eventType,
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                OldValues = SafeSerialize(oldValues, _logger),
                NewValues = SafeSerialize(newValues, _logger),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                RequestPath = requestPath,
                RequestMethod = requestMethod,
                StatusCode = statusCode,
                ErrorMessage = errorMessage,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log");
        }
    }

    public Task LogEntityCreatedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object newValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default)
    {
        return LogChangeAsync(
            userId,
            email,
            "EntityCreated",
            entityType,
            entityId,
            "Create",
            null,
            newValues,
            ipAddress,
            cancellationToken: cancellationToken);
    }

    public Task LogEntityUpdatedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object oldValues,
        object newValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default)
    {
        return LogChangeAsync(
            userId,
            email,
            "EntityUpdated",
            entityType,
            entityId,
            "Update",
            oldValues,
            newValues,
            ipAddress,
            cancellationToken: cancellationToken);
    }

    public Task LogEntityDeletedAsync(
        Guid? userId,
        string? email,
        string entityType,
        string entityId,
        object oldValues,
        string? ipAddress = null,
        CancellationToken cancellationToken = default)
    {
        return LogChangeAsync(
            userId,
            email,
            "EntityDeleted",
            entityType,
            entityId,
            "Delete",
            oldValues,
            null,
            ipAddress,
            cancellationToken: cancellationToken);
    }
}
