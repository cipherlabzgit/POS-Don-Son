namespace DMS_Backend.Models.DTOs.GridConfigurations;

public class GridConfigurationListDto
{
    public Guid Id { get; set; }
    public string GridName { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? ConfigurationName { get; set; }
    public int? PageSize { get; set; }
    public bool IsDefault { get; set; }
    public bool IsShared { get; set; }
    public bool IsActive { get; set; }
}
