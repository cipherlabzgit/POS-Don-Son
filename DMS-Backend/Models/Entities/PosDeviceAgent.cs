using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>POS till presence — heartbeats from DMS-POS while logged in.</summary>
[Table("pos_device_agents")]
public class PosDeviceAgent : BaseEntity
{
    /// <summary>Stable till id (local UUID on the POS machine).</summary>
    [Required]
    [MaxLength(80)]
    [Column("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [Column("outlet_id")]
    public Guid? OutletId { get; set; }

    [MaxLength(100)]
    [Column("outlet_name")]
    public string? OutletName { get; set; }

    [MaxLength(120)]
    [Column("device_name")]
    public string? DeviceName { get; set; }

    [MaxLength(120)]
    [Column("machine_name")]
    public string? MachineName { get; set; }

    [MaxLength(64)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("last_heartbeat_at")]
    public DateTime LastHeartbeatAt { get; set; } = DateTime.UtcNow;

    [MaxLength(40)]
    [Column("app_version")]
    public string? AppVersion { get; set; }

    [Column("pending_command")]
    public RemoteClientCommand PendingCommand { get; set; } = RemoteClientCommand.None;

    [Column("last_checked_at")]
    public DateTime? LastCheckedAt { get; set; }

    [ForeignKey(nameof(OutletId))]
    public virtual Outlet? Outlet { get; set; }
}
