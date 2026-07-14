namespace DMS_Backend.Models.DTOs.DeliveryTurns;

public sealed class DeliveryTurnSectionTimingDto
{
    public Guid Id { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public TimeSpan? ProductionStartTime { get; set; }
    public string? ProductionStartTimeFormatted => ProductionStartTime?.ToString(@"hh\:mm");
    public TimeSpan? EffectiveDeliveryTime { get; set; }
    public string? EffectiveDeliveryTimeFormatted => EffectiveDeliveryTime?.ToString(@"hh\:mm");
    /// <summary>
    /// Day offset for production start relative to delivery date.
    /// -1 = previous day (e.g., bakery starts at 11 PM the night before), 0 = same day.
    /// </summary>
    public int ProductionDayOffset { get; set; } = 0;
    /// <summary>
    /// Day offset for effective delivery relative to plan date.
    /// 0 = same day, +1 = next day (e.g., 5 AM delivery is the next calendar day).
    /// </summary>
    public int DeliveryDayOffset { get; set; } = 0;
}

public sealed class CreateDeliveryTurnSectionTimingDto
{
    public Guid ProductionSectionId { get; set; }
    public TimeSpan? ProductionStartTime { get; set; }
    public TimeSpan? EffectiveDeliveryTime { get; set; }
    public int ProductionDayOffset { get; set; } = 0;
    public int DeliveryDayOffset { get; set; } = 0;
}
