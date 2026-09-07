namespace DMS_Backend.Common;

public static class AppLoginClient
{
    public const string Pos = "pos";
    public const string Dms = "dms";
    public const string CashierRoleName = "Cashier";

    public static bool IsPos(string? client) =>
        string.Equals(client?.Trim(), Pos, StringComparison.OrdinalIgnoreCase);

    public static bool HasCashierRole(IEnumerable<string> roleNames) =>
        roleNames.Any(n => string.Equals(n, CashierRoleName, StringComparison.OrdinalIgnoreCase));

    public static bool IsCashierOnly(bool isSuperAdmin, IReadOnlyCollection<string> roleNames)
    {
        if (isSuperAdmin) return false;
        if (roleNames.Count == 0) return false;
        return roleNames.All(n => string.Equals(n, CashierRoleName, StringComparison.OrdinalIgnoreCase));
    }
}
