using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// System-wide configuration settings stored as key-value pairs.
/// Used for application configuration that can be changed without code deployment.
/// </summary>
[Table("system_settings")]
public class SystemSetting : BaseEntity
{
    [Required]
    [MaxLength(100)]
    [Column("setting_key")]
    public string SettingKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("setting_name")]
    public string SettingName { get; set; } = string.Empty;

    [Column("setting_value")]
    public string? SettingValue { get; set; }

    [MaxLength(50)]
    [Column("setting_type")]
    public string SettingType { get; set; } = "String"; // String, Number, Boolean, JSON

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(100)]
    [Column("category")]
    public string? Category { get; set; }

    [Column("is_system_setting")]
    public bool IsSystemSetting { get; set; } = false;

    [Column("is_encrypted")]
    public bool IsEncrypted { get; set; } = false;

    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;
}
