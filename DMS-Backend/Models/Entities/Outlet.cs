using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a showroom/outlet location where products are delivered.
/// Includes display order (rank) for numbering and organizing showrooms.
/// </summary>
[Table("outlets")]
public class Outlet : BaseEntity
{
    [Required]
    [MaxLength(20)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Secret till-bind key for POS clients. Not the public showroom Code.
    /// </summary>
    [MaxLength(40)]
    [Column("pos_verification_code")]
    public string? PosVerificationCode { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(200)]
    [Column("address")]
    public string Address { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [Column("contact_person")]
    public string? ContactPerson { get; set; }

    /// <summary>
    /// Display order/rank for showroom numbering.
    /// Used by admin to organize and number showrooms.
    /// Lower numbers appear first in lists and grids.
    /// </summary>
    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Location type: Showroom, Warehouse, Factory, etc.
    /// </summary>
    [MaxLength(50)]
    [Column("location_type")]
    public string? LocationType { get; set; }

    /// <summary>
    /// Whether this outlet has variants (Full/Mini size products).
    /// </summary>
    [Column("has_variants")]
    public bool HasVariants { get; set; } = true;

    /// <summary>
    /// Whether this outlet is included in delivery planning.
    /// </summary>
    [Column("is_delivery_point")]
    public bool IsDeliveryPoint { get; set; } = true;

    /// <summary>
    /// Default delivery turn ID for this outlet.
    /// </summary>
    [Column("default_delivery_turn_id")]
    public Guid? DefaultDeliveryTurnId { get; set; }

    /// <summary>
    /// GPS latitude for location tracking.
    /// </summary>
    [Column("latitude")]
    public decimal? Latitude { get; set; }

    /// <summary>
    /// GPS longitude for location tracking.
    /// </summary>
    [Column("longitude")]
    public decimal? Longitude { get; set; }

    /// <summary>
    /// Operating hours (e.g., "8:00 AM - 10:00 PM").
    /// </summary>
    [MaxLength(100)]
    [Column("operating_hours")]
    public string? OperatingHours { get; set; }

    /// <summary>
    /// Notes or special instructions for this outlet.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Whether this outlet appears in the Dashboard "Today Top Deliveries" widget.
    /// </summary>
    [Column("show_in_dashboard")]
    public bool ShowInDashboard { get; set; } = true;

    // Navigation properties
    [ForeignKey("DefaultDeliveryTurnId")]
    public virtual DeliveryTurn? DefaultDeliveryTurn { get; set; }

    public virtual ICollection<OutletEmployee> OutletEmployees { get; set; } = new List<OutletEmployee>();
}
