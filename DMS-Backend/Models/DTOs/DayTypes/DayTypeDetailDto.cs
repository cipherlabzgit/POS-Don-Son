namespace DMS_Backend.Models.DTOs.DayTypes;

public sealed class DayTypeDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Multiplier { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    /// <summary>Days of week this type applies to: 0=Sun,1=Mon,...,6=Sat</summary>
    public List<int> ApplicableDays { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
