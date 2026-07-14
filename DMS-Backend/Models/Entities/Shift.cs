using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a production shift (e.g., Morning, Evening, Night).
/// Shifts can be dynamically created and managed by administrators.
/// </summary>
[Table("shifts")]
public class Shift : BaseEntity
{
    /// <summary>
    /// Name of the shift (e.g., "Morning Shift", "Night Shift").
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Short code or identifier for the shift (e.g., "M", "E", "N").
    /// </summary>
    [Required]
    [MaxLength(10)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Start time of the shift.
    /// </summary>
    [Required]
    [Column("start_time")]
    public TimeSpan StartTime { get; set; }

    /// <summary>
    /// End time of the shift.
    /// </summary>
    [Required]
    [Column("end_time")]
    public TimeSpan EndTime { get; set; }

    /// <summary>
    /// Description or notes about the shift.
    /// </summary>
    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Display order for sorting shifts.
    /// </summary>
    [Column("display_order")]
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this shift is currently active.
    /// </summary>
    [Required]
    [Column("is_active")]
    public new bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<DailyProduction> DailyProductions { get; set; } = new List<DailyProduction>();
}
