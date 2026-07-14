using System.Globalization;

namespace DMS_Backend.Common;

internal static class PosSaleListQuery
{
    /// <summary>Parses yyyy-MM-dd filters into UTC half-open range [start, end).</summary>
    public static (DateTime? SoldFromUtcInclusive, DateTime? SoldToUtcExclusive) ParseSoldAtRange(
        string? startDateIso,
        string? endDateIso)
    {
        DateTime? start = null;
        DateTime? endExclusive = null;

        if (!string.IsNullOrWhiteSpace(startDateIso)
            && DateOnly.TryParse(startDateIso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var sd))
        {
            start = DateTime.SpecifyKind(sd.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        }

        if (!string.IsNullOrWhiteSpace(endDateIso)
            && DateOnly.TryParse(endDateIso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var ed))
        {
            endExclusive = DateTime.SpecifyKind(ed.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        }

        return (start, endExclusive);
    }
}
