namespace DMS_Backend.Models.DTOs.CashierBalance;

public sealed class CashierBalanceOutletRowDto
{
    public Guid OutletId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsShowroomClosed { get; set; }
    public Guid? OutletEmployeeId { get; set; }
    /// <summary>Total amount (sum of channel breakdown when present).</summary>
    public decimal? CashierBalance { get; set; }
    public decimal? BalanceCash { get; set; }
    public decimal? BalanceCard { get; set; }
    public decimal? BalanceUber { get; set; }
    public decimal? BalancePickme { get; set; }
}
