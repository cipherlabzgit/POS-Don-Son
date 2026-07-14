namespace DMS_Backend.Models.DTOs.CashierBalance;

public sealed class CashierBalanceContextDto
{
    public DateTime ProcessDate { get; set; }
    public bool IsSubmitted { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? SubmittedByName { get; set; }
    public IReadOnlyList<CashierBalanceOutletRowDto> Outlets { get; set; } = Array.Empty<CashierBalanceOutletRowDto>();
}
