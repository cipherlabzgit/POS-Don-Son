using System.Security.Claims;

namespace DMS_Backend.Common;

/// <summary>
/// Mirrors the reports hub day-end floor: dates on or before the last day-end lock are blocked
/// unless the user is a super-admin, has wildcard permissions, or holds <c>reports:allow-back-date</c>.
/// </summary>
public static class ReportDateFloorAuthorization
{
    public static bool CanBypassReportDayEndFloor(ClaimsPrincipal user)
    {
        if (user.FindFirst("isSuperAdmin")?.Value.Equals("true", StringComparison.OrdinalIgnoreCase) == true)
            return true;

        var permissions = user.FindAll("permission").Select(c => c.Value).ToHashSet(StringComparer.Ordinal);
        return permissions.Contains("*") || permissions.Contains("reports:allow-back-date");
    }
}
