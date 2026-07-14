namespace DMS_Backend.Models.DTOs.Shifts;

/// <summary>
/// DTO for updating an existing shift.
/// </summary>
public class UpdateShiftDto
{
    public required string Name { get; set; }
    public required string Code { get; set; }
    public required TimeSpan StartTime { get; set; }
    public required TimeSpan EndTime { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}
