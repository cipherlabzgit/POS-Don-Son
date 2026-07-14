namespace DMS_Backend.Models.DTOs.DayEnd;

public sealed class DayEndContextDto
{
    public DateTime ProcessDate { get; set; }
    public bool CashierBalanceApproved { get; set; }
    public bool DayLocked { get; set; }
    public string? LastDayEndProcessDate { get; set; }
    public IReadOnlyList<DayEndOutletRowDto> Outlets { get; set; } = Array.Empty<DayEndOutletRowDto>();
}
