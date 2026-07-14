namespace DMS_Backend.Models.DTOs.LabelSettings;

public class LabelSettingCreateDto
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingName { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string ValueType { get; set; } = "String";
    public int SortOrder { get; set; }
    public bool IsSystemSetting { get; set; }
    public bool IsActive { get; set; } = true;
}
