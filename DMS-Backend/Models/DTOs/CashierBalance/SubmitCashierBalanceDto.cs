namespace DMS_Backend.Models.DTOs.CashierBalance;

public sealed class SubmitCashierBalanceDto
{
    public DateTime ProcessDate { get; set; }
    public List<SubmitCashierBalanceLineDto> Lines { get; set; } = new();
}
