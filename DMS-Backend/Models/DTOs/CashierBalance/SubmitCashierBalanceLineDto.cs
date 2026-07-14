namespace DMS_Backend.Models.DTOs.CashierBalance;

public sealed class SubmitCashierBalanceLineDto
{
    public Guid OutletId { get; set; }
    public bool IsShowroomClosed { get; set; }
    public Guid? OutletEmployeeId { get; set; }
    /// <summary>Legacy single total when channel fields are not used.</summary>
    public decimal? CashierBalance { get; set; }
    public decimal? BalanceCash { get; set; }
    public decimal? BalanceCard { get; set; }
    public decimal? BalanceUber { get; set; }
    public decimal? BalancePickme { get; set; }
}
