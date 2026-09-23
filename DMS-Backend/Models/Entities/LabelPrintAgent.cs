using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("label_print_agents")]
public class LabelPrintAgent : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("station_code")]
    public string StationCode { get; set; } = string.Empty;

    [MaxLength(120)]
    [Column("machine_name")]
    public string? MachineName { get; set; }

    [MaxLength(200)]
    [Column("printer_name")]
    public string? PrinterName { get; set; }

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
}
