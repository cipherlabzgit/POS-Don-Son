using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

public enum DnPrintJobStatus
{
    Pending = 0,
    Claimed = 1,
    Printed = 2,
    Failed = 3,
    Cancelled = 4,
}

/// <summary>
/// Hybrid DN print queue job claimed by the WPF DN Print Client.
/// </summary>
[Table("dn_print_jobs")]
public class DnPrintJob : BaseEntity
{
    [Required]
    [Column("delivery_id")]
    public Guid DeliveryId { get; set; }

    [MaxLength(50)]
    [Column("delivery_no")]
    public string DeliveryNo { get; set; } = string.Empty;

    [Required]
    [Column("status")]
    public DnPrintJobStatus Status { get; set; } = DnPrintJobStatus.Pending;

    /// <summary>
    /// Optional station filter (empty = any station may claim).
    /// </summary>
    [MaxLength(50)]
    [Column("station_code")]
    public string? StationCode { get; set; }

    [MaxLength(50)]
    [Column("claimed_by_station")]
    public string? ClaimedByStation { get; set; }

    [Column("claimed_at")]
    public DateTime? ClaimedAt { get; set; }

    [Column("printed_at")]
    public DateTime? PrintedAt { get; set; }

    [MaxLength(150)]
    [Column("requested_by_name")]
    public string RequestedByName { get; set; } = string.Empty;

    [Column("requested_by_user_id")]
    public Guid? RequestedByUserId { get; set; }

    /// <summary>
    /// Snapshot JSON for offline-safe WPF rendering (DnPrintPayloadDto).
    /// </summary>
    [Required]
    [Column("payload_json")]
    public string PayloadJson { get; set; } = "{}";

    [MaxLength(500)]
    [Column("error_message")]
    public string? ErrorMessage { get; set; }

    [ForeignKey(nameof(DeliveryId))]
    public virtual Delivery? Delivery { get; set; }
}
