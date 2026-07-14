namespace DMS_Backend.Models.DTOs.Permissions;

public sealed class PermissionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class PermissionsByModuleDto
{
    public string Module { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new();
}
