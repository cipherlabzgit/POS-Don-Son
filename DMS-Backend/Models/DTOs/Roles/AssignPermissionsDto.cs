using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Roles;

public sealed class AssignPermissionsDto
{
    [Required]
    public List<Guid> PermissionIds { get; set; } = new();
}
