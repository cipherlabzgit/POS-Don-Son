namespace DMS_Backend.Models.DTOs.DayEnd;

public sealed class SubmitDayEndDto
{
    public DateTime ProcessDate { get; set; }
    public List<SubmitDayEndLineDto> Lines { get; set; } = new();
}
