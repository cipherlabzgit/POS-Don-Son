namespace DMS_Backend.Common;

/// <summary>
/// Delivery date rules: full calendar freedom only for super-admin (*), or users with
/// both <c>operation:delivery:allow-back-date</c> and <c>operation:delivery:allow-future-date</c>.
/// Otherwise: only back-date permission, only future permission, or neither — with restricted users
/// fixed to "now" on create and unable to change the stored timestamp on update.
/// </summary>
public static class DeliveryDatePolicy
{
    public const string AllowBackDate = "operation:delivery:allow-back-date";
    public const string AllowFutureDate = "operation:delivery:allow-future-date";

    private const int CreateToleranceMinutes = 8;
    private const int UpdateUnchangedToleranceSeconds = 120;

    private static bool HasStar(IReadOnlyCollection<string> codes) =>
        codes.Contains("*", StringComparer.Ordinal);

    private static bool HasBothGrants(IReadOnlyCollection<string> codes) =>
        codes.Contains(AllowBackDate, StringComparer.Ordinal)
        && codes.Contains(AllowFutureDate, StringComparer.Ordinal);

    private static DateTime ToUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc),
        };
    }

    /// <summary>True when client may pick any delivery instant (subject to other business rules).</summary>
    public static bool HasFullDateFreedom(IReadOnlyCollection<string> permissionCodes) =>
        HasStar(permissionCodes) || HasBothGrants(permissionCodes);

    public static void ValidateForCreate(DateTime deliveryDate, IReadOnlyCollection<string> permissionCodes)
    {
        var dtoUtc = ToUtc(deliveryDate);
        var now = DateTime.UtcNow;

        if (HasFullDateFreedom(permissionCodes))
            return;

        var allowBack = HasStar(permissionCodes)
            || permissionCodes.Contains(AllowBackDate, StringComparer.Ordinal);
        var allowFuture = HasStar(permissionCodes)
            || permissionCodes.Contains(AllowFutureDate, StringComparer.Ordinal);

        if (!allowBack && !allowFuture)
        {
            var skew = Math.Abs((dtoUtc - now).TotalMinutes);
            if (skew > CreateToleranceMinutes)
                throw new InvalidOperationException(
                    "Delivery date and time must match the current time. Back-dated or future-dated deliveries require the appropriate permissions.");
            return;
        }

        if (allowBack && !allowFuture)
        {
            if (dtoUtc.Date > now.Date)
                throw new InvalidOperationException(
                    "Future delivery dates require the allow-future-date permission.");
            return;
        }

        // allowFuture && !allowBack
        if (dtoUtc.Date < now.Date)
            throw new InvalidOperationException(
                "Back-dated deliveries require the allow-back-date permission.");
    }

    public static void ValidateForUpdate(
        DateTime newDeliveryDate,
        DateTime existingDeliveryDateUtc,
        IReadOnlyCollection<string> permissionCodes)
    {
        var dtoUtc = ToUtc(newDeliveryDate);
        var existingUtc = ToUtc(existingDeliveryDateUtc);
        var now = DateTime.UtcNow;

        if (HasFullDateFreedom(permissionCodes))
            return;

        var allowBack = HasStar(permissionCodes)
            || permissionCodes.Contains(AllowBackDate, StringComparer.Ordinal);
        var allowFuture = HasStar(permissionCodes)
            || permissionCodes.Contains(AllowFutureDate, StringComparer.Ordinal);

        if (!allowBack && !allowFuture)
        {
            var delta = Math.Abs((dtoUtc - existingUtc).TotalSeconds);
            if (delta > UpdateUnchangedToleranceSeconds)
                throw new InvalidOperationException(
                    "You cannot change the delivery date and time. Users with back-date and future-date permissions may adjust it.");
            return;
        }

        if (allowBack && !allowFuture)
        {
            if (dtoUtc.Date > now.Date)
                throw new InvalidOperationException(
                    "Future delivery dates require the allow-future-date permission.");
            return;
        }

        if (!allowBack && allowFuture)
        {
            if (dtoUtc.Date < now.Date)
                throw new InvalidOperationException(
                    "Back-dated deliveries require the allow-back-date permission.");
        }
    }
}
