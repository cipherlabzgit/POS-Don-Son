using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Roles;

public sealed class CreateRoleDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public List<Guid> PermissionIds { get; set; } = new();
}
