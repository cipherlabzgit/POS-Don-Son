using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

public sealed class Permission
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystemPermission { get; set; } = true;
    
    // Make nullable to work without the column existing in database
    [Column("DisplayOrder")]
    public int? DisplayOrder { get; set; } = 0;
    
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
