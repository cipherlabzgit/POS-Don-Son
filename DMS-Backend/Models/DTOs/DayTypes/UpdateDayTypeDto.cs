namespace DMS_Backend.Models.DTOs.DayTypes;

public sealed class UpdateDayTypeDto
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal Multiplier { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public List<int> ApplicableDays { get; set; } = new();
}
