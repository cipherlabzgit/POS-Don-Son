using System.Globalization;

namespace DMS_Backend.Common;

/// <summary>
/// Converts UTC instants to Sri Lanka wall-clock (Asia/Colombo, UTC+5:30) for user-visible text and date windows.
/// Storage remains UTC; this is display and "business calendar day" alignment only.
/// </summary>
public static class SriLankaDisplayTime
{
    private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

    public static TimeZoneInfo Zone => DeliveryPlanPreloadRules.SriLankaTimeZone;

    /// <summary>Interpret <paramref name="utcInstant"/> as UTC and convert to local components in Sri Lanka.</summary>
    public static DateTime UtcToSriLanka(DateTime utcInstant)
    {
        var utc = utcInstant.Kind switch
        {
            DateTimeKind.Utc => utcInstant,
            DateTimeKind.Local => utcInstant.ToUniversalTime(),
            _ => DateTime.SpecifyKind(utcInstant, DateTimeKind.Utc),
        };
        return TimeZoneInfo.ConvertTimeFromUtc(utc, Zone);
    }

    public static string FormatUtcInstant(DateTime utcInstant, string format = "yyyy-MM-dd HH:mm") =>
        UtcToSriLanka(utcInstant).ToString(format, Invariant);

    /// <summary>
    /// [start, end) UTC range covering the current calendar day in Asia/Colombo (matches business "today" in SL).
    /// </summary>
    public static (DateTime StartUtc, DateTime EndUtc) GetCurrentSriLankaDayUtcWindow()
    {
        var tz = Zone;
        var todaySl = DeliveryPlanPreloadRules.TodaySriLanka();
        var startLocal = DateTime.SpecifyKind(
            todaySl.ToDateTime(TimeOnly.MinValue),
            DateTimeKind.Unspecified);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, tz);
        return (startUtc, startUtc.AddDays(1));
    }
}
