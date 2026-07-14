namespace DMS_Backend.Models.DTOs.GridConfigurations;

public class GridConfigurationCreateDto
{
    public string GridName { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? ConfigurationName { get; set; }
    public string? ColumnSettings { get; set; }
    public string? SortSettings { get; set; }
    public string? FilterSettings { get; set; }
    public int? PageSize { get; set; }
    public bool IsDefault { get; set; }
    public bool IsShared { get; set; }
    public bool IsActive { get; set; } = true;
}
