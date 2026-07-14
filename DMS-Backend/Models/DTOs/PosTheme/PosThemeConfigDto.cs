namespace DMS_Backend.Models.DTOs.PosTheme;

public class PosThemeConfigDto
{
    public Guid Id { get; set; }
    public string ThemeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PrimaryColor { get; set; } = string.Empty;
    public string? PrimaryLight { get; set; }
    public string? PrimaryDark { get; set; }
    public string AccentColor { get; set; } = string.Empty;
    public string? AccentLight { get; set; }
    public string? AccentDark { get; set; }
    public List<string>? CategoryColors { get; set; }
    public bool IsActive { get; set; }
    public bool IsSystem { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePosThemeConfigDto
{
    public string ThemeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PrimaryColor { get; set; } = "#C8102E";
    public string? PrimaryLight { get; set; }
    public string? PrimaryDark { get; set; }
    public string AccentColor { get; set; } = "#FFD100";
    public string? AccentLight { get; set; }
    public string? AccentDark { get; set; }
    public List<string>? CategoryColors { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

public class UpdatePosThemeConfigDto
{
    public string? ThemeName { get; set; }
    public string? Description { get; set; }
    public string? PrimaryColor { get; set; }
    public string? PrimaryLight { get; set; }
    public string? PrimaryDark { get; set; }
    public string? AccentColor { get; set; }
    public string? AccentLight { get; set; }
    public string? AccentDark { get; set; }
    public List<string>? CategoryColors { get; set; }
    public int? DisplayOrder { get; set; }
}

/// <summary>
/// Lightweight DTO for POS terminals to fetch the active theme
/// </summary>
public class ActivePosThemeDto
{
    public string PrimaryColor { get; set; } = "#C8102E";
    public string PrimaryLight { get; set; } = "#E31837";
    public string PrimaryDark { get; set; } = "#A00D26";
    public string AccentColor { get; set; } = "#FFD100";
    public string AccentLight { get; set; } = "#FFDC33";
    public string AccentDark { get; set; } = "#CCAA00";
    public List<string> CategoryColors { get; set; } = new()
    {
        "#ffd100", "#c8102e", "#16a34a", "#1d4ed8", 
        "#9333ea", "#ea580c", "#db2777", "#0891b2"
    };
}
