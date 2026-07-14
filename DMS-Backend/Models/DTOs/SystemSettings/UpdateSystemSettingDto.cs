namespace DMS_Backend.Models.DTOs.SystemSettings;

public sealed class UpdateSystemSettingDto
{
    public required string SettingKey { get; set; }
    public required string SettingName { get; set; }
    public string? SettingValue { get; set; }
    public required string SettingType { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsSystemSetting { get; set; }
    public bool IsEncrypted { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}
