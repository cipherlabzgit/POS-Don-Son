using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelPrintAgentService
{
    const int OfflineAfterSeconds = 15;
    const string ClientKeySettingName = "LABEL_PRINT_CLIENT_KEY";

    Task<DnPrintAgentStatusDto> HeartbeatAsync(LabelPrintHeartbeatDto dto, string? ipAddress, CancellationToken cancellationToken = default);
    Task<DnPrintPresenceDto> GetPresenceAsync(CancellationToken cancellationToken = default);
    Task QueueCommandAsync(RemoteClientCommand command, CancellationToken cancellationToken = default);
}

public interface IPosDeviceAgentService
{
    /// <summary>POS considered offline after this many seconds without heartbeat.</summary>
    const int OfflineAfterSeconds = 90;

    Task<PosDeviceStatusDto> HeartbeatAsync(PosDeviceHeartbeatDto dto, string? ipAddress, CancellationToken cancellationToken = default);
    Task<PosDevicePresenceDto> GetPresenceAsync(CancellationToken cancellationToken = default);
    Task QueueRefreshAsync(Guid? deviceRowId, CancellationToken cancellationToken = default);
    Task QueueRefreshAllAsync(CancellationToken cancellationToken = default);
}
