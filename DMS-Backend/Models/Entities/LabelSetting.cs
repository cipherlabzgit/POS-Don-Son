using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Global label printing settings and configurations.
/// </summary>
[Table("label_settings")]
public class LabelSetting : BaseEntity
{
    [Required]
    [MaxLength(100)]
    [Column("setting_key")]
    public string SettingKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("setting_name")]
    public string SettingName { get; set; } = string.Empty;

    [Column("setting_value", TypeName = "text")]
    public string? SettingValue { get; set; }

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Setting category (e.g., "Printer", "Format", "Behavior")
    /// </summary>
    [MaxLength(100)]
    [Column("category")]
    public string? Category { get; set; }

    /// <summary>
    /// Data type (String, Integer, Boolean, Decimal, JSON)
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("value_type")]
    public string ValueType { get; set; } = "String";

    /// <summary>
    /// Display order
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; }

    /// <summary>
    /// Is system setting (cannot be deleted)
    /// </summary>
    [Column("is_system_setting")]
    public bool IsSystemSetting { get; set; }
}
