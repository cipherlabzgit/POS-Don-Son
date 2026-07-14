using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// POS terminal theme configuration.
/// Allows administrators to customize the visual appearance of POS terminals
/// by changing brand colors, backgrounds, and other visual elements.
/// </summary>
[Table("pos_theme_configs")]
public class PosThemeConfig : BaseEntity
{
    [Required]
    [MaxLength(100)]
    [Column("theme_name")]
    public string ThemeName { get; set; } = "Default";

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Primary brand color (e.g., #C8102E for Don & Sons red).
    /// Used for headers, primary buttons, and main branding elements.
    /// </summary>
    [Required]
    [MaxLength(7)]
    [Column("primary_color")]
    public string PrimaryColor { get; set; } = "#C8102E";

    /// <summary>
    /// Primary color light variant
    /// </summary>
    [MaxLength(7)]
    [Column("primary_light")]
    public string? PrimaryLight { get; set; } = "#E31837";

    /// <summary>
    /// Primary color dark variant
    /// </summary>
    [MaxLength(7)]
    [Column("primary_dark")]
    public string? PrimaryDark { get; set; } = "#A00D26";

    /// <summary>
    /// Accent color (e.g., #FFD100 for Don & Sons gold).
    /// Used for secondary buttons, highlights, and call-to-action elements.
    /// </summary>
    [Required]
    [MaxLength(7)]
    [Column("accent_color")]
    public string AccentColor { get; set; } = "#FFD100";

    /// <summary>
    /// Accent color light variant
    /// </summary>
    [MaxLength(7)]
    [Column("accent_light")]
    public string? AccentLight { get; set; } = "#FFDC33";

    /// <summary>
    /// Accent color dark variant
    /// </summary>
    [MaxLength(7)]
    [Column("accent_dark")]
    public string? AccentDark { get; set; } = "#CCAA00";

    /// <summary>
    /// Category colors as JSON array of hex color strings.
    /// Used for category pills/tabs in the POS catalog view.
    /// Format: ["#ffd100", "#c8102e", "#16a34a", "#1d4ed8", "#9333ea", "#ea580c", "#db2777", "#0891b2"]
    /// </summary>
    [Column("category_colors", TypeName = "jsonb")]
    public string? CategoryColors { get; set; }

    /// <summary>
    /// Whether this theme is currently active (not to be confused with BaseEntity.IsActive).
    /// This field determines which theme is applied to POS terminals.
    /// Using 'new' keyword to hide BaseEntity.IsActive intentionally.
    /// </summary>
    [Column("is_active")]
    public new bool IsActive { get; set; } = false;

    /// <summary>
    /// Whether this is a system-provided theme (cannot be deleted)
    /// </summary>
    [Column("is_system")]
    public bool IsSystem { get; set; } = false;

    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;
}
