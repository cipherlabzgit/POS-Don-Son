namespace DMS_Backend.Models.DTOs.DeliveryPlans;

/// <summary>
/// Allowed planning window (next three Sri Lanka calendar days from tomorrow) and eligible 5:00 AM preload turns.
/// </summary>
public class DeliveryPlanningWindowDto
{
    public IReadOnlyList<string> AllowedPlanDates { get; set; } = Array.Empty<string>();
    public string MinPlanDate { get; set; } = string.Empty;
    public string MaxPlanDate { get; set; } = string.Empty;
    /// <summary>Active delivery turns at 5:00 AM only (preload slot).</summary>
    public IReadOnlyList<DeliveryTurnOptionDto> AvailableDeliveryTurns { get; set; } =
        Array.Empty<DeliveryTurnOptionDto>();
}

/// <summary>A delivery turn option shown when creating a preload delivery plan.</summary>
public sealed class DeliveryTurnOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DeliveryTimeDisplay { get; set; } = string.Empty;
}
