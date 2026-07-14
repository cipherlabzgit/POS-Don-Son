using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// One submitted day-end line per showroom for a process date (audit trail).
/// </summary>
[Table("day_end_outlet_lines")]
public sealed class DayEndOutletLine
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("process_date")]
    public DateTime ProcessDate { get; set; }

    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Column("outlet_employee_id")]
    public Guid OutletEmployeeId { get; set; }

    [Column("cashier_balance", TypeName = "decimal(18,4)")]
    public decimal CashierBalance { get; set; }

    [Column("system_balance", TypeName = "decimal(18,4)")]
    public decimal SystemBalance { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("created_by_id")]
    public Guid CreatedById { get; set; }

    public Outlet Outlet { get; set; } = null!;
    public OutletEmployee OutletEmployee { get; set; } = null!;
}
