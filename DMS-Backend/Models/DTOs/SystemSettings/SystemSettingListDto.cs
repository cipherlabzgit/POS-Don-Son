namespace DMS_Backend.Models.DTOs.SystemSettings;

public sealed class SystemSettingListDto
{
    public Guid Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingName { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public string SettingType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsSystemSetting { get; set; }
    public bool IsEncrypted { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
