using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// User-specific or global grid configurations for data tables.
/// Stores column visibility, order, width, sorting preferences.
/// </summary>
[Table("grid_configurations")]
public class GridConfiguration : BaseEntity
{
    /// <summary>
    /// Grid identifier (e.g., "products-grid", "orders-grid")
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("grid_name")]
    public string GridName { get; set; } = string.Empty;

    /// <summary>
    /// User ID if user-specific, null for global
    /// </summary>
    [Column("user_id")]
    public Guid? UserId { get; set; }

    public User? User { get; set; }

    /// <summary>
    /// Configuration name for multiple saved configs per grid
    /// </summary>
    [MaxLength(100)]
    [Column("configuration_name")]
    public string? ConfigurationName { get; set; }

    /// <summary>
    /// Column settings (JSON array)
    /// [{ "field": "code", "visible": true, "width": 100, "order": 1 }, ...]
    /// </summary>
    [Column("column_settings", TypeName = "jsonb")]
    public string? ColumnSettings { get; set; }

    /// <summary>
    /// Sort settings (JSON)
    /// { "field": "code", "direction": "asc" }
    /// </summary>
    [Column("sort_settings", TypeName = "jsonb")]
    public string? SortSettings { get; set; }

    /// <summary>
    /// Filter settings (JSON)
    /// </summary>
    [Column("filter_settings", TypeName = "jsonb")]
    public string? FilterSettings { get; set; }

    /// <summary>
    /// Page size preference
    /// </summary>
    [Column("page_size")]
    public int? PageSize { get; set; }

    /// <summary>
    /// Is default configuration for this grid
    /// </summary>
    [Column("is_default")]
    public bool IsDefault { get; set; }

    /// <summary>
    /// Is shared with all users
    /// </summary>
    [Column("is_shared")]
    public bool IsShared { get; set; }
}
