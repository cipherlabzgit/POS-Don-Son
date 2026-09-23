namespace DMS_Backend.Models.DTOs.DnPrint;

public sealed class DnPrintLineDto
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}

/// <summary>
/// Shared 5×5 DN print payload for web fallback + WPF DN Print Client.
/// </summary>
public sealed class DnPrintPayloadDto
{
    public Guid DeliveryId { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public string DeliveryDate { get; set; } = string.Empty;
    public string ShowroomName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string PrintedBy { get; set; } = string.Empty;
    public string PrintedAt { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public List<DnPrintLineDto> Lines { get; set; } = new();
    /// <summary>Rows per physical page (fixed 12).</summary>
    public int RowsPerPage { get; set; } = 12;
    public double PageWidthInches { get; set; } = 5;
    public double PageHeightInches { get; set; } = 5;
}

public sealed class EnqueueDnPrintJobDto
{
    public Guid DeliveryId { get; set; }
    public string? StationCode { get; set; }
}

public sealed class EnqueueDnPrintJobsDto
{
    public List<Guid> DeliveryIds { get; set; } = new();
    public string? StationCode { get; set; }
}

public class DnPrintJobListItemDto
{
    public Guid Id { get; set; }
    public Guid DeliveryId { get; set; }
    public string DeliveryNo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? StationCode { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime? PrintedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class DnPrintJobDetailDto : DnPrintJobListItemDto
{
    public DnPrintPayloadDto Payload { get; set; } = new();
    public string? ClaimedByStation { get; set; }
}

public sealed class ClaimDnPrintJobDto
{
    public string StationCode { get; set; } = string.Empty;
}

public sealed class FailDnPrintJobDto
{
    public string StationCode { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public sealed class DnPrintHeartbeatDto
{
    public string StationCode { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public string? PrinterName { get; set; }
    public string? AppVersion { get; set; }
}

public sealed class DnPrintAgentStatusDto
{
    public string StationCode { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public string? PrinterName { get; set; }
    public string? IpAddress { get; set; }
    public DateTime LastHeartbeatAt { get; set; }
    public bool IsOnline { get; set; }
    public int SecondsSinceHeartbeat { get; set; }
    public string? PendingCommand { get; set; }
    public DateTime? LastCheckedAt { get; set; }
}

public sealed class DnPrintPresenceDto
{
    /// <summary>True when at least one agent heartbeated within the online window.</summary>
    public bool IsOnline { get; set; }
    public int OnlineAgentCount { get; set; }
    public int OfflineSecondsThreshold { get; set; }
    public List<DnPrintAgentStatusDto> Agents { get; set; } = new();
    public string QueueUrlHint { get; set; } = "/api/dn-print-jobs/pending";
}

public sealed class LabelPrintHeartbeatDto
{
    public string StationCode { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public string? PrinterName { get; set; }
    public string? AppVersion { get; set; }
}

public sealed class PosDeviceHeartbeatDto
{
    public string DeviceId { get; set; } = string.Empty;
    public Guid? OutletId { get; set; }
    public string? OutletName { get; set; }
    public string? DeviceName { get; set; }
    public string? MachineName { get; set; }
    public string? AppVersion { get; set; }
}

public sealed class PosDeviceStatusDto
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public Guid? OutletId { get; set; }
    public string Showroom { get; set; } = string.Empty;
    public string Device { get; set; } = string.Empty;
    public string Status { get; set; } = "Unknown";
    public bool IsOnline { get; set; }
    public DateTime? LastHeartbeatAt { get; set; }
    public string? PendingCommand { get; set; }
    public DateTime? LastCheckedAt { get; set; }
}

public sealed class PosDevicePresenceDto
{
    public int OnlineCount { get; set; }
    public int OfflineCount { get; set; }
    public int UnknownCount { get; set; }
    public DateTime CheckedAt { get; set; }
    public int OfflineSecondsThreshold { get; set; }
    public List<PosDeviceStatusDto> Devices { get; set; } = new();
}
