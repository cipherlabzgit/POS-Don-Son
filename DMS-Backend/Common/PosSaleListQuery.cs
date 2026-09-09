using System.Globalization;

namespace DMS_Backend.Common;

internal static class PosSaleListQuery
{
    /// <summary>Parses yyyy-MM-dd (Sri Lanka calendar) into UTC half-open SoldAt range [start, end).</summary>
    public static (DateTime? SoldFromUtcInclusive, DateTime? SoldToUtcExclusive) ParseSoldAtRange(
        string? startDateIso,
        string? endDateIso)
    {
        DateTime? start = null;
        DateTime? endExclusive = null;

        if (!string.IsNullOrWhiteSpace(startDateIso)
            && DateOnly.TryParse(startDateIso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var sd))
        {
            start = DeliveryPlanPreloadRules.SlDateToUtcMidnight(sd);
        }

        if (!string.IsNullOrWhiteSpace(endDateIso)
            && DateOnly.TryParse(endDateIso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var ed))
        {
            endExclusive = DeliveryPlanPreloadRules.SlDateToUtcMidnight(ed.AddDays(1));
        }

        return (start, endExclusive);
    }
}
