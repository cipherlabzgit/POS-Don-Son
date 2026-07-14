using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.Users;

public sealed class AssignRolesDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one role must be assigned")]
    public List<Guid> RoleIds { get; set; } = new();
}
