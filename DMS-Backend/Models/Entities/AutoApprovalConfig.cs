namespace DMS_Backend.Models.Entities;

public sealed class AutoApprovalConfig
{
    public Guid Id { get; set; }
    public string SubsectionCode { get; set; } = string.Empty; // e.g., "production:daily"
    public string SubsectionName { get; set; } = string.Empty; // e.g., "Daily Production"
    public string Module { get; set; } = string.Empty; // "Operation", "Production", "DMS"
    public bool IsEnabled { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
