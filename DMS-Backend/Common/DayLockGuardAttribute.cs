namespace DMS_Backend.Common;

/// <summary>
/// Marks a controller action for day-lock enforcement.
/// Actions with this attribute will be blocked if the operation date is locked.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class DayLockGuardAttribute : Attribute
{
    /// <summary>
    /// The name of the parameter that contains the date to check
    /// </summary>
    public string? DateParameterName { get; set; }

    public DayLockGuardAttribute()
    {
    }

    public DayLockGuardAttribute(string dateParameterName)
    {
        DateParameterName = dateParameterName;
    }
}
