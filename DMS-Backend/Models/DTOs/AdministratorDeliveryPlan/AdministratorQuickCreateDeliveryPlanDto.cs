namespace DMS_Backend.Models.DTOs.AdministratorDeliveryPlan;

/// <summary>
/// Create a delivery plan for an allowed date and day type, seed from default quantities, submit, and sync deliveries.
/// </summary>
public sealed class AdministratorQuickCreateDeliveryPlanDto
{
    /// <summary>UTC calendar date, yyyy-MM-dd.</summary>
    public required string PlanDate { get; set; }
    public required Guid DayTypeId { get; set; }
    public required Guid DeliveryTurnId { get; set; }
    public bool UseFreezerStock { get; set; }
    public string? Notes { get; set; }
}
