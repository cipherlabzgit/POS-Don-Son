using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Workflow configuration for document approval processes.
/// </summary>
[Table("workflow_configs")]
public class WorkflowConfig : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Entity type this workflow applies to (e.g., "StockAdjustment", "Cancellation")
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("entity_type")]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// Workflow type (e.g., "Approval", "Review", "Notification")
    /// </summary>
    [MaxLength(50)]
    [Column("workflow_type")]
    public string WorkflowType { get; set; } = "Approval";

    /// <summary>
    /// Is approval required for this workflow
    /// </summary>
    [Column("requires_approval")]
    public bool RequiresApproval { get; set; } = true;

    /// <summary>
    /// Number of approval levels
    /// </summary>
    [Column("approval_levels")]
    public int ApprovalLevels { get; set; } = 1;

    /// <summary>
    /// Auto-approve if under threshold amount
    /// </summary>
    [Column("auto_approve_threshold", TypeName = "decimal(18,2)")]
    public decimal? AutoApproveThreshold { get; set; }

    /// <summary>
    /// Approval steps configuration (JSON)
    /// [{ "level": 1, "roleIds": [...], "condition": "..." }, ...]
    /// </summary>
    [Column("approval_steps", TypeName = "jsonb")]
    public string? ApprovalSteps { get; set; }

    /// <summary>
    /// Notification settings (JSON)
    /// </summary>
    [Column("notification_settings", TypeName = "jsonb")]
    public string? NotificationSettings { get; set; }

    /// <summary>
    /// Timeout in hours for each approval step
    /// </summary>
    [Column("timeout_hours")]
    public int? TimeoutHours { get; set; }

    /// <summary>
    /// Escalation configuration (JSON)
    /// </summary>
    [Column("escalation_config", TypeName = "jsonb")]
    public string? EscalationConfig { get; set; }

    /// <summary>
    /// Is enabled
    /// </summary>
    [Column("is_enabled")]
    public bool IsEnabled { get; set; } = true;
}
