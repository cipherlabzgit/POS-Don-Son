namespace DMS_Backend.Models.DTOs.DeliveryTurns;

public sealed class DeliveryTurnListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TimeSpan Time { get; set; }
    public string TimeFormatted => Time.ToString(@"hh\:mm");
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int SectionTimingsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
