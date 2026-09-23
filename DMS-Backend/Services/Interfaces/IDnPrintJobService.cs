using DMS_Backend.Models.DTOs.DnPrint;

namespace DMS_Backend.Services.Interfaces;

public interface IDnPrintJobService
{
    Task<DnPrintJobDetailDto> EnqueueAsync(
        Guid deliveryId,
        string? stationCode,
        Guid? requestedByUserId,
        string requestedByName,
        CancellationToken cancellationToken = default);

    Task<List<DnPrintJobDetailDto>> EnqueueManyAsync(
        IEnumerable<Guid> deliveryIds,
        string? stationCode,
        Guid? requestedByUserId,
        string requestedByName,
        CancellationToken cancellationToken = default);

    Task<List<DnPrintJobDetailDto>> GetPendingAsync(
        string? stationCode,
        int take = 10,
        CancellationToken cancellationToken = default);

    Task<DnPrintJobDetailDto?> ClaimAsync(
        Guid jobId,
        string stationCode,
        CancellationToken cancellationToken = default);

    Task<DnPrintJobDetailDto?> CompleteAsync(
        Guid jobId,
        string stationCode,
        CancellationToken cancellationToken = default);

    Task<DnPrintJobDetailDto?> FailAsync(
        Guid jobId,
        string stationCode,
        string? errorMessage,
        CancellationToken cancellationToken = default);
}
