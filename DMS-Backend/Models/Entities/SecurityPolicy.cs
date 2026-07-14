using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Security policies for access control, password rules, and system security.
/// </summary>
[Table("security_policies")]
public class SecurityPolicy : BaseEntity
{
    [Required]
    [MaxLength(100)]
    [Column("policy_key")]
    public string PolicyKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("policy_name")]
    public string PolicyName { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Policy category (e.g., "Password", "Session", "Access", "Audit")
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Policy value (could be JSON for complex rules)
    /// </summary>
    [Column("policy_value", TypeName = "text")]
    public string? PolicyValue { get; set; }

    /// <summary>
    /// Value type (String, Integer, Boolean, JSON)
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("value_type")]
    public string ValueType { get; set; } = "String";

    /// <summary>
    /// Is policy enforced
    /// </summary>
    [Column("is_enforced")]
    public bool IsEnforced { get; set; } = true;

    /// <summary>
    /// Is system policy (cannot be deleted)
    /// </summary>
    [Column("is_system_policy")]
    public bool IsSystemPolicy { get; set; }

    /// <summary>
    /// Severity level (Low, Medium, High, Critical)
    /// </summary>
    [MaxLength(20)]
    [Column("severity_level")]
    public string? SeverityLevel { get; set; }

    /// <summary>
    /// Last reviewed date
    /// </summary>
    [Column("last_reviewed_at")]
    public DateTime? LastReviewedAt { get; set; }

    /// <summary>
    /// Display order
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; }
}
