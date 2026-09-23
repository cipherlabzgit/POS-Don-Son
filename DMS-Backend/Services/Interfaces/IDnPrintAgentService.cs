using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface IDnPrintAgentService
{
    /// <summary>Agents offline if no heartbeat for this many seconds.</summary>
    const int OfflineAfterSeconds = 15;

    Task<DnPrintAgentStatusDto> HeartbeatAsync(
        DnPrintHeartbeatDto dto,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<DnPrintPresenceDto> GetPresenceAsync(CancellationToken cancellationToken = default);

    Task QueueCommandAsync(RemoteClientCommand command, CancellationToken cancellationToken = default);
}
