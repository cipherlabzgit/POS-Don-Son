namespace DMS_Backend.Models.DTOs.DeliveryTurns;

public sealed class UpdateDeliveryTurnDto
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required TimeSpan Time { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<CreateDeliveryTurnSectionTimingDto> SectionTimings { get; set; } = new();
}
