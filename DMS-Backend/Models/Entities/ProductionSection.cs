using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a production section (Bakery, Filling, Short-Eats, Rotty, Plain Roll).
/// Each section has its own production planners and stores issue notes.
/// </summary>
[Table("production_sections")]
public class ProductionSection : BaseEntity
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
    /// Display order for sorting sections in reports.
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Color code for UI display (e.g., "#C8102E" for Bakery).
    /// </summary>
    [MaxLength(20)]
    [Column("color_code")]
    public string? ColorCode { get; set; }

    /// <summary>
    /// Icon name for UI display (e.g., "bread", "cake").
    /// </summary>
    [MaxLength(50)]
    [Column("icon_name")]
    public string? IconName { get; set; }

    /// <summary>
    /// Department or area where this section is located.
    /// </summary>
    [MaxLength(100)]
    [Column("department")]
    public string? Department { get; set; }

    public string? Location => Department;

    /// <summary>
    /// Manager or supervisor of this section.
    /// </summary>
    [MaxLength(100)]
    [Column("supervisor_name")]
    public string? SupervisorName { get; set; }

    /// <summary>
    /// Whether this section requires separate stores issue notes.
    /// </summary>
    [Column("requires_sin")]
    public bool RequiresSIN { get; set; } = true;

    /// <summary>
    /// Whether this section has production planners.
    /// </summary>
    [Column("has_production_planner")]
    public bool HasProductionPlanner { get; set; } = true;

    /// <summary>
    /// Default production start time for this section.
    /// </summary>
    [Column("default_production_start_time")]
    public TimeSpan? DefaultProductionStartTime { get; set; }

    // Navigation properties
    public virtual ICollection<SectionConsumable> SectionConsumables { get; set; } = new List<SectionConsumable>();
    public virtual ICollection<ProductSectionAssignment> ProductAssignments { get; set; } = new List<ProductSectionAssignment>();

    public int DisplayOrder => SortOrder;
}
