using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("delivery_turn_section_timings")]
public class DeliveryTurnSectionTiming : BaseEntity
{
    [Required]
    [Column("delivery_turn_id")]
    public Guid DeliveryTurnId { get; set; }

    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    [Column("production_start_time")]
    public TimeSpan? ProductionStartTime { get; set; }

    [Column("effective_delivery_time")]
    public TimeSpan? EffectiveDeliveryTime { get; set; }

    /// <summary>
    /// Day offset for production start relative to delivery date.
    /// -1 = previous day (e.g., bakery starts at 11 PM the night before).
    /// 0 = same day. Default is 0.
    /// </summary>
    [Column("production_day_offset")]
    public int ProductionDayOffset { get; set; } = 0;

    /// <summary>
    /// Day offset for effective delivery relative to the plan date.
    /// 0 = same day, +1 = next day (e.g., 5 AM delivery is next calendar day).
    /// Default is 0.
    /// </summary>
    [Column("delivery_day_offset")]
    public int DeliveryDayOffset { get; set; } = 0;

    // Navigation properties
    public virtual DeliveryTurn? DeliveryTurn { get; set; }
    public virtual ProductionSection? ProductionSection { get; set; }
}
