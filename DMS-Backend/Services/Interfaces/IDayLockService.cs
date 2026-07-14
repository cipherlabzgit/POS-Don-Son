namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Service for managing day-lock functionality
/// </summary>
public interface IDayLockService
{
    /// <summary>
    /// Check if a specific date is locked
    /// </summary>
    Task<bool> IsDateLockedAsync(DateTime date, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the last day-end processed date
    /// </summary>
    Task<DateTime?> GetLastDayEndDateAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the minimum allowed date for operations (day after last day-end)
    /// </summary>
    Task<DateTime> GetMinAllowedDateAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lock a specific date
    /// </summary>
    Task LockDateAsync(DateTime date, Guid? lockedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Unlock a specific date (admin only)
    /// </summary>
    Task UnlockDateAsync(DateTime date, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all locked dates in a range
    /// </summary>
    Task<List<DateTime>> GetLockedDatesAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lock a day (alias for LockDateAsync)
    /// </summary>
    Task<dynamic> LockDayAsync(DateTime date, Guid? lockedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the last locked date
    /// </summary>
    Task<DateTime?> GetLastLockedDateAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a day is locked (alias for IsDateLockedAsync)
    /// </summary>
    Task<bool> IsDayLockedAsync(DateTime date, CancellationToken cancellationToken = default);
}
