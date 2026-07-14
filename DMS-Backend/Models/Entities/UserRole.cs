namespace DMS_Backend.Models.Entities;

public sealed class UserRole
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public Guid? AssignedById { get; set; }
    public User? AssignedBy { get; set; }
    public DateTimeOffset AssignedAt { get; set; }
}
