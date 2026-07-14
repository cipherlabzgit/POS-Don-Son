namespace DMS_Backend.Models.DTOs.Auth;

public sealed class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsSuperAdmin { get; set; }
    public bool IsActive { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();

    /// <summary>Showroom linked via <c>outlet_employees</c> (manager preferred). Null when not assigned.</summary>
    public Guid? AssignedOutletId { get; set; }

    /// <summary>Display name for <see cref="AssignedOutletId"/>.</summary>
    public string? AssignedOutletName { get; set; }
}

public sealed class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
