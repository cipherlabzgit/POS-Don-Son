using System.Globalization;

namespace DMS_Backend.Common;

/// <summary>
/// Sri Lanka preload delivery plans: plan dates are tomorrow–today+3 (inclusive) in Asia/Colombo,
/// and only the 5:00 AM delivery turn is allowed for pre-load planning.
/// </summary>
public static class DeliveryPlanPreloadRules
{
    private static readonly TimeZoneInfo SriLankaZone = ResolveSriLankaZone();
    private static readonly CultureInfo DisplayCulture = CultureInfo.GetCultureInfo("en-US");

    public static TimeZoneInfo SriLankaTimeZone => SriLankaZone;

    private static TimeZoneInfo ResolveSriLankaZone()
    {
        foreach (var id in new[] { "Asia/Colombo", "Sri Lanka Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch
            {
                // try next id
            }
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            "SL+05:30",
            TimeSpan.FromMinutes(330),
            "Sri Lanka Standard Time",
            "Sri Lanka Standard Time");
    }

    /// <summary>Today's calendar date in Asia/Colombo.</summary>
    public static DateOnly TodaySriLanka() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SriLankaZone));

    /// <summary>
    /// Allowed preload plan dates: tomorrow through three days ahead (three inclusive days), Sri Lanka calendar.
    /// </summary>
    public static (DateOnly Min, DateOnly Max) GetAllowedPlanDateRangeSriLanka()
    {
        var today = TodaySriLanka();
        return (today.AddDays(1), today.AddDays(3));
    }

    /// <summary>
    /// Converts a Sri Lanka wall date to UTC <see cref="DateTime"/> matching midnight at the start of that date in SL.
    /// </summary>
    public static DateTime SlDateToUtcMidnight(DateOnly slDate)
    {
        var slMidnight = slDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(slMidnight, SriLankaZone);
    }

    /// <summary>
    /// Formats a delivery time for UI (e.g. 5:00 AM).
    /// </summary>
    public static string FormatDeliveryTimeDisplay(TimeSpan time)
    {
        var today = DateTime.Today;
        return today.Add(time).ToString("h:mm tt", DisplayCulture);
    }

    /// <summary>
    /// Pre-load plans must use the turn scheduled at exactly 5:00 AM local wall time.
    /// </summary>
    public static bool IsPreloadFiveAmDeliveryTime(TimeSpan deliveryTime) =>
        deliveryTime.Hours == 5 && deliveryTime.Minutes == 0 && deliveryTime.Seconds == 0;

    /// <summary>
    /// Resolves the Sri Lanka business calendar date for a plan header.
    /// Date-only API values (Unspecified midnight) are treated as the selected SL calendar date.
    /// Otherwise the instant is converted from UTC to Sri Lanka local date.
    /// </summary>
    public static DateOnly ResolvePlanBusinessDateSriLanka(DateTime planDate)
    {
        if (planDate.Kind == DateTimeKind.Unspecified && planDate.TimeOfDay == TimeSpan.Zero)
        {
            return new DateOnly(planDate.Year, planDate.Month, planDate.Day);
        }

        var utc = planDate.Kind switch
        {
            DateTimeKind.Utc => planDate,
            DateTimeKind.Local => planDate.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(planDate, DateTimeKind.Utc),
            _ => planDate.ToUniversalTime()
        };

        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utc, SriLankaZone).Date);
    }

    /// <summary>
    /// Throws if <paramref name="planDateSl"/> is outside the preload window.
    /// </summary>
    public static void ValidatePlanDateInPreloadWindow(DateOnly planDateSl)
    {
        var (min, max) = GetAllowedPlanDateRangeSriLanka();
        if (planDateSl < min || planDateSl > max)
        {
            throw new InvalidOperationException(
                $"Plan date must be between {min:yyyy-MM-dd} and {max:yyyy-MM-dd} (Sri Lanka time), inclusive.");
        }
    }
}
