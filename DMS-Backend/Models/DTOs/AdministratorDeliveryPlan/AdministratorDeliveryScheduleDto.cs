namespace DMS_Backend.Models.DTOs.AdministratorDeliveryPlan;

/// <summary>
/// A schedule row shown on the Administrator Delivery Plan page (from active day types).
/// </summary>
public sealed class AdministratorDeliveryScheduleDto
{
    public Guid DayTypeId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
