using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Singleton POS sale-records window: cashier-turn week start and how many weeks to show.
/// </summary>
[Table("sale_records_settings")]
public sealed class SaleRecordsSettings
{
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>0 = Sunday … 6 = Saturday (matches <see cref="DayOfWeek"/>).</summary>
    [Column("week_start_day")]
    public int WeekStartDay { get; set; } = (int)DayOfWeek.Wednesday;

    /// <summary>Number of cashier-turn weeks on POS, including the current week.</summary>
    [Column("weeks_to_show")]
    public int WeeksToShow { get; set; } = 2;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("updated_by_id")]
    public Guid? UpdatedById { get; set; }
}
