using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class DayLockService : IDayLockService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DayLockService> _logger;

    public DayLockService(ApplicationDbContext context, ILogger<DayLockService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> IsDateLockedAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        var lockDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dayLock = await _context.DayLocks
            .FirstOrDefaultAsync(dl => dl.LockDate == lockDate && dl.IsLocked, cancellationToken);

        return dayLock != null;
    }

    public async Task<DateTime?> GetLastDayEndDateAsync(CancellationToken cancellationToken = default)
    {
        var lastLock = await _context.DayLocks
            .Where(dl => dl.IsLocked)
            .OrderByDescending(dl => dl.LockDate)
            .FirstOrDefaultAsync(cancellationToken);

        return lastLock?.LockDate;
    }

    public async Task<DateTime> GetMinAllowedDateAsync(CancellationToken cancellationToken = default)
    {
        var lastDayEnd = await GetLastDayEndDateAsync(cancellationToken);
        
        if (lastDayEnd.HasValue)
        {
            return lastDayEnd.Value.AddDays(1);
        }

        // If no day-end has been run, allow any date from today onwards
        return DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
    }

    public async Task LockDateAsync(DateTime date, Guid? lockedBy, CancellationToken cancellationToken = default)
    {
        var lockDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var existingLock = await _context.DayLocks
            .FirstOrDefaultAsync(dl => dl.LockDate == lockDate, cancellationToken);

        if (existingLock != null)
        {
            existingLock.IsLocked = true;
            existingLock.LockedBy = lockedBy;
            existingLock.LockedAt = DateTime.UtcNow;
            existingLock.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var newLock = new DayLock
            {
                Id = Guid.NewGuid(),
                LockDate = lockDate,
                IsLocked = true,
                LockedBy = lockedBy,
                LockedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.DayLocks.Add(newLock);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Date {Date} locked by user {UserId}", lockDate, lockedBy);
    }

    public async Task UnlockDateAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        var lockDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var existingLock = await _context.DayLocks
            .FirstOrDefaultAsync(dl => dl.LockDate == lockDate, cancellationToken);

        if (existingLock != null)
        {
            existingLock.IsLocked = false;
            existingLock.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Date {Date} unlocked", lockDate);
        }
    }

    public async Task<List<DateTime>> GetLockedDatesAsync(
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var start = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(endDate.Date, DateTimeKind.Utc);

        return await _context.DayLocks
            .Where(dl => dl.IsLocked && dl.LockDate >= start && dl.LockDate <= end)
            .Select(dl => dl.LockDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<dynamic> LockDayAsync(DateTime date, Guid? lockedBy, CancellationToken cancellationToken = default)
    {
        var lockDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var existingLock = await _context.DayLocks
            .FirstOrDefaultAsync(dl => dl.LockDate == lockDate, cancellationToken);

        DayLock dayLock;
        if (existingLock != null)
        {
            existingLock.IsLocked = true;
            existingLock.LockedBy = lockedBy;
            existingLock.LockedAt = DateTime.UtcNow;
            existingLock.UpdatedAt = DateTime.UtcNow;
            dayLock = existingLock;
        }
        else
        {
            dayLock = new DayLock
            {
                Id = Guid.NewGuid(),
                LockDate = lockDate,
                IsLocked = true,
                LockedBy = lockedBy,
                LockedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.DayLocks.Add(dayLock);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Date {Date} locked by user {UserId}", lockDate, lockedBy);

        return dayLock;
    }

    public async Task<DateTime?> GetLastLockedDateAsync(CancellationToken cancellationToken = default)
    {
        return await GetLastDayEndDateAsync(cancellationToken);
    }

    public async Task<bool> IsDayLockedAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        return await IsDateLockedAsync(date, cancellationToken);
    }
}
