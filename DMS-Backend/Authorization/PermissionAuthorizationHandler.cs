using Microsoft.AspNetCore.Authorization;

namespace DMS_Backend.Authorization;

/// <summary>
/// Authorization handler that validates permission claims against required permissions
/// </summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Check if user has the "permission" claim type (set by JwtService)
        var permissions = context.User.FindAll("permission")
            .Select(c => c.Value)
            .ToList();

        // Super-admin has all permissions (marked with "*")
        if (permissions.Contains("*"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // User needs any one of the listed permissions (alternatives are separated by | in the policy)
        if (requirement.Permissions.Any(p => permissions.Contains(p)))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Permission not found - fail
        return Task.CompletedTask;
    }
}
