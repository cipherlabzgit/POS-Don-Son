using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a day type for delivery planning (Weekday, Saturday, Sunday, Holiday, Special Event).
/// Used to determine default order quantities based on the type of day.
/// </summary>
[Table("day_types")]
public class DayType : BaseEntity
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
    /// Color code for UI display (e.g., "#FF0000" for holidays).
    /// </summary>
    [MaxLength(20)]
    [Column("color_code")]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Icon name for UI display (e.g., "calendar", "sun", "star").
    /// </summary>
    [MaxLength(50)]
    [Column("icon_name")]
    public string? IconName { get; set; }

    /// <summary>
    /// Display order for sorting day types.
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this day type applies multiplier to default quantities.
    /// </summary>
    [Column("apply_multiplier")]
    public bool ApplyMultiplier { get; set; } = false;

    /// <summary>
    /// Quantity multiplier for this day type (e.g., 1.5 for holidays).
    /// </summary>
    [Column("quantity_multiplier", TypeName = "decimal(5,2)")]
    public decimal QuantityMultiplier { get; set; } = 1.0m;

    /// <summary>
    /// Whether this day type is a default system type (cannot be deleted).
    /// </summary>
    [Column("is_system_type")]
    public bool IsSystemType { get; set; } = false;

    /// <summary>
    /// Days of the week this day type applies to, stored as a comma-separated list
    /// of integers: 0=Sunday, 1=Monday, ..., 6=Saturday.
    /// Empty means no specific days are assigned.
    /// </summary>
    [MaxLength(20)]
    [Column("applicable_days")]
    public string? ApplicableDays { get; set; }

    public decimal Multiplier => QuantityMultiplier;

    /// <summary>Returns the applicable days as a parsed integer list.</summary>
    [NotMapped]
    public List<int> ApplicableDaysList
    {
        get => string.IsNullOrWhiteSpace(ApplicableDays)
            ? new List<int>()
            : ApplicableDays.Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(int.Parse)
                            .ToList();
        set => ApplicableDays = value.Count > 0
            ? string.Join(",", value.OrderBy(d => d))
            : null;
    }
}
