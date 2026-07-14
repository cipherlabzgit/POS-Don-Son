using System.Security.Claims;

namespace DMS_Backend.Common;

/// <summary>
/// Daily Production list visibility: super-admin / wildcard sees all users;
/// optional <see cref="showPreviousRecords"/> expands to full history (still all users).
/// Other users see only their own rows added today (UTC create timestamp).
/// </summary>
public static class DailyProductionAuthorization
{
    public static bool CanViewAllDailyProductionRecords(ClaimsPrincipal user)
    {
        if (user.FindFirst("isSuperAdmin")?.Value.Equals("true", StringComparison.OrdinalIgnoreCase) == true)
            return true;
        return user.HasClaim("permission", "*");
    }
}
