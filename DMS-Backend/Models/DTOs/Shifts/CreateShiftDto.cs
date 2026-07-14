namespace DMS_Backend.Models.DTOs.Shifts;

/// <summary>
/// DTO for creating a new shift.
/// </summary>
public class CreateShiftDto
{
    public required string Name { get; set; }
    public required string Code { get; set; }
    public required TimeSpan StartTime { get; set; }
    public required TimeSpan EndTime { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
