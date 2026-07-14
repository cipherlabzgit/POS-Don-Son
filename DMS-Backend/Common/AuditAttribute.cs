namespace DMS_Backend.Common;

/// <summary>
/// Marks a controller action for automatic audit logging
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class AuditAttribute : Attribute
{
    public string? EntityType { get; set; }
    public string? Action { get; set; }

    public AuditAttribute()
    {
    }

    public AuditAttribute(string entityType, string action)
    {
        EntityType = entityType;
        Action = action;
    }
}
