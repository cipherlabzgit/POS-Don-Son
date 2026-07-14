namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a locked date that prevents editing
/// </summary>
public sealed class DayLock
{
    public Guid Id { get; set; }
    public DateTime LockDate { get; set; }
    public bool IsLocked { get; set; }
    public Guid? LockedBy { get; set; }
    public DateTime? LockedAt { get; set; }
    public string? LockReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? LockedByUser { get; set; }
}
