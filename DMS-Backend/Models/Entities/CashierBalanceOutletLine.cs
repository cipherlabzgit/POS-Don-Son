using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Per-outlet cashier balance entry for a business date (before day-end approval).
/// </summary>
[Table("cashier_balance_outlet_lines")]
public sealed class CashierBalanceOutletLine
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("process_date")]
    public DateTime ProcessDate { get; set; }

    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Column("is_showroom_closed")]
    public bool IsShowroomClosed { get; set; }

    [Column("outlet_employee_id")]
    public Guid? OutletEmployeeId { get; set; }

    [Column("cashier_balance")]
    public decimal? CashierBalance { get; set; }

    [Column("balance_cash")]
    public decimal? BalanceCash { get; set; }

    [Column("balance_card")]
    public decimal? BalanceCard { get; set; }

    [Column("balance_uber")]
    public decimal? BalanceUber { get; set; }

    [Column("balance_pickme")]
    public decimal? BalancePickme { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Outlet? Outlet { get; set; }
    public OutletEmployee? OutletEmployee { get; set; }
}
