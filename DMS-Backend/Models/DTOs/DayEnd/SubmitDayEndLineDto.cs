namespace DMS_Backend.Models.DTOs.DayEnd;

public sealed class SubmitDayEndLineDto
{
    public Guid OutletId { get; set; }
    public Guid OutletEmployeeId { get; set; }
    public decimal CashierBalance { get; set; }
}
