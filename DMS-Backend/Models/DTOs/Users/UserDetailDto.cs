namespace DMS_Backend.Models.DTOs.Users;

public sealed class UserDetailDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public bool IsSuperAdmin { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public List<RoleInfoDto> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
