namespace DMS_Backend.Models.DTOs.SystemSettings;

public sealed class CreateSystemSettingDto
{
    public required string SettingKey { get; set; }
    public required string SettingName { get; set; }
    public string? SettingValue { get; set; }
    public string SettingType { get; set; } = "String";
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsSystemSetting { get; set; } = false;
    public bool IsEncrypted { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
