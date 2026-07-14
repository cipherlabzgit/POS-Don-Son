using Microsoft.AspNetCore.Authorization;

namespace DMS_Backend.Common;

/// <summary>
/// Authorization attribute that requires specific permission(s)
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "HasPermission:";

    public HasPermissionAttribute(string permission)
    {
        Permission = permission;
        Policy = $"{PolicyPrefix}{permission}";
    }

    public string Permission { get; }
}
