namespace DMS_Backend.Models.DTOs.SystemSettings;

/// <summary>
/// Update only the stored value (used by PUT key/{key} for flag-style settings).
/// </summary>
public sealed class UpdateSystemSettingValueDto
{
    public required string SettingValue { get; set; }
}
