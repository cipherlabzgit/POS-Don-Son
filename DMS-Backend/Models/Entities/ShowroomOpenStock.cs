using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents opening stock date per showroom (tracks last Stock BF Date).
/// </summary>
[Table("showroom_open_stock")]
public class ShowroomOpenStock : BaseEntity
{
    /// <summary>
    /// The outlet (showroom) for this opening stock record.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// Last Stock BF Date (stock as at this date).
    /// </summary>
    [Required]
    [Column("stock_as_at")]
    public DateTime StockAsAt { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
}
