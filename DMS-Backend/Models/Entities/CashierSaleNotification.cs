using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Admin “Notify To Cashier” snapshot for a locked process date and showroom.
/// </summary>
[Table("cashier_sale_notifications")]
public sealed class CashierSaleNotification
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("process_date")]
    public DateTime ProcessDate { get; set; }

    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Column("outlet_employee_id")]
    public Guid OutletEmployeeId { get; set; }

    [Column("cashier_user_id")]
    public Guid? CashierUserId { get; set; }

    [Column("outlet_name")]
    public string OutletName { get; set; } = string.Empty;

    [Column("showroom_sale", TypeName = "decimal(18,4)")]
    public decimal ShowroomSale { get; set; }

    [Column("system_sale", TypeName = "decimal(18,4)")]
    public decimal SystemSale { get; set; }

    [Column("difference", TypeName = "decimal(18,4)")]
    public decimal Difference { get; set; }

    [Column("notified_at")]
    public DateTime NotifiedAt { get; set; }

    [Column("notified_by_id")]
    public Guid NotifiedById { get; set; }

    [Column("is_read")]
    public bool IsRead { get; set; }

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    public Outlet Outlet { get; set; } = null!;
    public OutletEmployee OutletEmployee { get; set; } = null!;
}
