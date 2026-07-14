using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a delivery turn/slot (e.g., 5:00 AM, 10:30 AM, 3:30 PM).
/// Used for scheduling multiple deliveries per day.
/// </summary>
[Table("delivery_turns")]
public class DeliveryTurn : BaseEntity
{
    [Required]
    [MaxLength(20)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Turn number (1, 2, 3, 4) for ordering.
    /// </summary>
    [Column("turn_number")]
    public int TurnNumber { get; set; }

    /// <summary>
    /// Scheduled delivery time (e.g., "05:00:00", "10:30:00").
    /// </summary>
    [Required]
    [Column("delivery_time")]
    public TimeSpan DeliveryTime { get; set; }

    /// <summary>
    /// Cutoff time for orders (e.g., previous day 10:00 PM).
    /// </summary>
    [Column("order_cutoff_time")]
    public TimeSpan? OrderCutoffTime { get; set; }

    /// <summary>
    /// Production start time for this turn.
    /// </summary>
    [Column("production_start_time")]
    public TimeSpan? ProductionStartTime { get; set; }

    /// <summary>
    /// Whether this turn crosses midnight.
    /// </summary>
    [Column("crosses_midnight")]
    public bool CrossesMidnight { get; set; } = false;

    /// <summary>
    /// Display order for sorting turns.
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this turn is available for immediate orders.
    /// </summary>
    [Column("allow_immediate_orders")]
    public bool AllowImmediateOrders { get; set; } = false;

    // Navigation properties
    public virtual ICollection<Outlet> Outlets { get; set; } = new List<Outlet>();
    public virtual ICollection<DeliveryTurnSectionTiming> SectionTimings { get; set; } = new List<DeliveryTurnSectionTiming>();

    public int DisplayOrder => SortOrder;
}
