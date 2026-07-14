namespace DMS_Backend.Models.DTOs.DayEnd;

public sealed class DayEndCashierOptionDto
{
    public Guid OutletEmployeeId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}
