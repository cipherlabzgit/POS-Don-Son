using Microsoft.AspNetCore.Authorization;

namespace DMS_Backend.Authorization;

/// <summary>
/// Authorization requirement for permission-based authorization.
/// The permission string may list alternatives separated by | (user needs any one).
/// </summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public IReadOnlyList<string> Permissions { get; }

    public PermissionRequirement(string permissionSpec)
    {
        Permissions = permissionSpec.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (Permissions.Count == 0)
            throw new ArgumentException("At least one permission is required.", nameof(permissionSpec));
    }
}
