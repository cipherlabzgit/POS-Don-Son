using System.Text.Json;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class DnPrintJobService : IDnPrintJobService
{
    public const string ClientKeySettingName = "DN_PRINT_CLIENT_KEY";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly ApplicationDbContext _context;

    public DnPrintJobService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DnPrintJobDetailDto> EnqueueAsync(
        Guid deliveryId,
        string? stationCode,
        Guid? requestedByUserId,
        string requestedByName,
        CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == deliveryId, cancellationToken)
            ?? throw new InvalidOperationException("Delivery not found.");

        var printedBy = string.IsNullOrWhiteSpace(requestedByName)
            ? (delivery.CreatedBy?.FullName ?? "System")
            : requestedByName.Trim();

        var payload = BuildPayload(delivery, printedBy);
        var job = new DnPrintJob
        {
            Id = Guid.NewGuid(),
            DeliveryId = delivery.Id,
            DeliveryNo = delivery.DeliveryNo,
            Status = DnPrintJobStatus.Pending,
            StationCode = string.IsNullOrWhiteSpace(stationCode) ? null : stationCode.Trim(),
            RequestedByName = printedBy,
            RequestedByUserId = requestedByUserId,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOptions),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedById = requestedByUserId,
            IsActive = true,
        };

        _context.DnPrintJobs.Add(job);
        await _context.SaveChangesAsync(cancellationToken);
        return ToDetail(job, payload);
    }

    public async Task<List<DnPrintJobDetailDto>> EnqueueManyAsync(
        IEnumerable<Guid> deliveryIds,
        string? stationCode,
        Guid? requestedByUserId,
        string requestedByName,
        CancellationToken cancellationToken = default)
    {
        var results = new List<DnPrintJobDetailDto>();
        foreach (var id in deliveryIds.Distinct())
        {
            results.Add(await EnqueueAsync(id, stationCode, requestedByUserId, requestedByName, cancellationToken));
        }
        return results;
    }

    public async Task<List<DnPrintJobDetailDto>> GetPendingAsync(
        string? stationCode,
        int take = 10,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 50);
        var query = _context.DnPrintJobs
            .AsNoTracking()
            .Where(j => j.IsActive && j.Status == DnPrintJobStatus.Pending);

        if (!string.IsNullOrWhiteSpace(stationCode))
        {
            var code = stationCode.Trim();
            query = query.Where(j => j.StationCode == null || j.StationCode == code);
        }

        var jobs = await query
            .OrderBy(j => j.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);

        return jobs.Select(j => ToDetail(j, DeserializePayload(j.PayloadJson))).ToList();
    }

    public async Task<DnPrintJobDetailDto?> ClaimAsync(
        Guid jobId,
        string stationCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(stationCode))
            throw new InvalidOperationException("Station code is required.");

        var job = await _context.DnPrintJobs
            .FirstOrDefaultAsync(j => j.Id == jobId && j.IsActive, cancellationToken);
        if (job == null) return null;

        if (job.Status != DnPrintJobStatus.Pending)
            throw new InvalidOperationException($"Job is not pending (status={job.Status}).");

        if (!string.IsNullOrWhiteSpace(job.StationCode)
            && !string.Equals(job.StationCode, stationCode.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Job is assigned to a different station.");

        job.Status = DnPrintJobStatus.Claimed;
        job.ClaimedByStation = stationCode.Trim();
        job.ClaimedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDetail(job, DeserializePayload(job.PayloadJson));
    }

    public async Task<DnPrintJobDetailDto?> CompleteAsync(
        Guid jobId,
        string stationCode,
        CancellationToken cancellationToken = default)
    {
        var job = await _context.DnPrintJobs
            .FirstOrDefaultAsync(j => j.Id == jobId && j.IsActive, cancellationToken);
        if (job == null) return null;

        if (job.Status is not (DnPrintJobStatus.Claimed or DnPrintJobStatus.Pending))
            throw new InvalidOperationException($"Job cannot be completed (status={job.Status}).");

        job.Status = DnPrintJobStatus.Printed;
        job.ClaimedByStation ??= stationCode.Trim();
        job.PrintedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;
        job.ErrorMessage = null;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDetail(job, DeserializePayload(job.PayloadJson));
    }

    public async Task<DnPrintJobDetailDto?> FailAsync(
        Guid jobId,
        string stationCode,
        string? errorMessage,
        CancellationToken cancellationToken = default)
    {
        var job = await _context.DnPrintJobs
            .FirstOrDefaultAsync(j => j.Id == jobId && j.IsActive, cancellationToken);
        if (job == null) return null;

        job.Status = DnPrintJobStatus.Failed;
        job.ClaimedByStation ??= stationCode.Trim();
        job.ErrorMessage = string.IsNullOrWhiteSpace(errorMessage)
            ? "Print failed"
            : errorMessage.Trim()[..Math.Min(errorMessage.Trim().Length, 500)];
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDetail(job, DeserializePayload(job.PayloadJson));
    }

    private static DnPrintPayloadDto BuildPayload(Delivery delivery, string printedBy)
    {
        var lines = delivery.Items
            .OrderBy(i => i.Product?.Code ?? i.Product?.Name ?? "")
            .Select(i => new DnPrintLineDto
            {
                ProductCode = i.Product?.Code ?? string.Empty,
                ProductName = i.Product?.Name ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Total = i.Total,
            })
            .ToList();

        return new DnPrintPayloadDto
        {
            DeliveryId = delivery.Id,
            DeliveryNo = delivery.DeliveryNo,
            DeliveryDate = delivery.DeliveryDate.ToString("o"),
            ShowroomName = delivery.Outlet?.Name ?? string.Empty,
            Status = delivery.Status.ToString(),
            Notes = delivery.Notes,
            PrintedBy = printedBy,
            PrintedAt = DateTime.UtcNow.ToString("o"),
            TotalItems = delivery.TotalItems,
            TotalValue = delivery.TotalValue,
            Lines = lines,
            RowsPerPage = 12,
            PageWidthInches = 5,
            PageHeightInches = 5,
        };
    }

    private static DnPrintPayloadDto DeserializePayload(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<DnPrintPayloadDto>(json, JsonOptions) ?? new DnPrintPayloadDto();
        }
        catch
        {
            return new DnPrintPayloadDto();
        }
    }

    private static DnPrintJobDetailDto ToDetail(DnPrintJob job, DnPrintPayloadDto payload) => new()
    {
        Id = job.Id,
        DeliveryId = job.DeliveryId,
        DeliveryNo = job.DeliveryNo,
        Status = job.Status.ToString(),
        StationCode = job.StationCode,
        ClaimedByStation = job.ClaimedByStation,
        RequestedByName = job.RequestedByName,
        CreatedAt = job.CreatedAt,
        ClaimedAt = job.ClaimedAt,
        PrintedAt = job.PrintedAt,
        ErrorMessage = job.ErrorMessage,
        Payload = payload,
    };
}
