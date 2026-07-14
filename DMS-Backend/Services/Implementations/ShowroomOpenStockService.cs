using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.ShowroomOpenStock;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ShowroomOpenStockService : IShowroomOpenStockService
{
    private readonly ApplicationDbContext _context;

    public ShowroomOpenStockService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShowroomOpenStockListDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var outlets = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.Code)
            .ToListAsync(cancellationToken);

        var bfRows = await _context.StockBFs
            .AsNoTracking()
            .Where(s => (s.IsActive && (s.Status == StockBFStatus.Approved || s.Status == StockBFStatus.Adjusted)))
            .Select(s => new { s.OutletId, s.BFDate, s.UpdatedAt })
            .ToListAsync(cancellationToken);

        var byOutlet = bfRows
            .GroupBy(x => x.OutletId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var list = new List<ShowroomOpenStockListDto>();

        foreach (var o in outlets)
        {
            DateTime? stockAsAt = null;
            int? lineCount = null;
            DateTime updatedAt = o.UpdatedAt;

            if (byOutlet.TryGetValue(o.Id, out var rows) && rows.Count > 0)
            {
                var maxDate = rows.Max(x => x.BFDate);
                var atMax = rows.Where(x => x.BFDate == maxDate).ToList();
                stockAsAt = maxDate;
                lineCount = atMax.Count;
                updatedAt = atMax.Max(x => x.UpdatedAt);
            }

            list.Add(new ShowroomOpenStockListDto
            {
                Id = o.Id,
                OutletId = o.Id,
                OutletCode = o.Code,
                OutletName = o.Name,
                StockAsAt = stockAsAt,
                BfLineCount = lineCount,
                UpdatedAt = updatedAt
            });
        }

        return list;
    }

    public async Task<ShowroomOpenStockDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var legacy = await _context.ShowroomOpenStocks
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (legacy != null)
            return await BuildDetailFromOutletAsync(legacy.OutletId, cancellationToken);

        var outlet = await _context.Outlets
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.IsActive, cancellationToken);
        if (outlet == null)
            return null;

        return await BuildDetailFromOutletAsync(id, cancellationToken);
    }

    public async Task<ShowroomOpenStockDetailDto?> GetByOutletIdAsync(Guid outletId, CancellationToken cancellationToken = default)
    {
        var outlet = await _context.Outlets
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == outletId && o.IsActive, cancellationToken);
        if (outlet == null)
            return null;

        return await BuildDetailFromOutletAsync(outletId, cancellationToken);
    }

    public async Task<ShowroomOpenStockDetailDto> CreateAsync(CreateShowroomOpenStockDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await _context.ShowroomOpenStocks
            .FirstOrDefaultAsync(s => s.OutletId == dto.OutletId, cancellationToken);

        if (existing != null)
            throw new InvalidOperationException("Showroom open stock already exists for this outlet");

        var showroomOpenStock = new ShowroomOpenStock
        {
            Id = Guid.NewGuid(),
            OutletId = dto.OutletId,
            StockAsAt = dto.StockAsAt,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ShowroomOpenStocks.Add(showroomOpenStock);
        await _context.SaveChangesAsync(cancellationToken);

        var built = await BuildDetailFromOutletAsync(dto.OutletId, cancellationToken);
        return built ?? throw new InvalidOperationException("Failed to retrieve created showroom open stock");
    }

    public async Task<ShowroomOpenStockDetailDto?> UpdateAsync(Guid id, UpdateShowroomOpenStockDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var legacy = await _context.ShowroomOpenStocks
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        var outletId = legacy?.OutletId ?? id;

        var outlet = await _context.Outlets.FirstOrDefaultAsync(o => o.Id == outletId && o.IsActive, cancellationToken);
        if (outlet == null)
            return null;

        var newDateUtc = DateTime.SpecifyKind(dto.StockAsAt.Date, DateTimeKind.Utc);

        var latestBfDate = await _context.StockBFs
            .Where(s => s.OutletId == outletId && s.IsActive &&
                        (s.Status == StockBFStatus.Approved || s.Status == StockBFStatus.Adjusted))
            .Select(s => (DateTime?)s.BFDate)
            .MaxAsync(cancellationToken);

        if (latestBfDate == null)
            throw new InvalidOperationException("No approved or adjusted Stock BF exists for this showroom.");

        var oldDate = latestBfDate.Value;
        if (oldDate.Date == newDateUtc.Date)
            return await BuildDetailFromOutletAsync(outletId, cancellationToken);

        var rowsToMove = await _context.StockBFs
            .Where(s => s.OutletId == outletId && s.BFDate == oldDate && s.IsActive &&
                        (s.Status == StockBFStatus.Approved || s.Status == StockBFStatus.Adjusted))
            .ToListAsync(cancellationToken);

        if (rowsToMove.Count == 0)
            throw new InvalidOperationException("No Stock BF lines found for the effective date.");

        var movingIds = rowsToMove.Select(r => r.Id).ToHashSet();
        var movingProductIds = rowsToMove.Select(r => r.ProductId).ToHashSet();

        var hasConflict = await _context.StockBFs
            .AnyAsync(
                s => s.OutletId == outletId &&
                     s.BFDate == newDateUtc &&
                     s.IsActive &&
                     movingProductIds.Contains(s.ProductId) &&
                     !movingIds.Contains(s.Id),
                cancellationToken);

        if (hasConflict)
        {
            throw new InvalidOperationException(
                "Cannot move to this date: Stock BF lines already exist for one or more products on the target date.");
        }

        var now = DateTime.UtcNow;
        foreach (var row in rowsToMove)
        {
            row.BFDate = newDateUtc;
            row.UpdatedById = userId;
            row.UpdatedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await BuildDetailFromOutletAsync(outletId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var showroomOpenStock = await _context.ShowroomOpenStocks
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (showroomOpenStock == null)
            return false;

        showroomOpenStock.IsActive = false;
        showroomOpenStock.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task<ShowroomOpenStockDetailDto?> BuildDetailFromOutletAsync(Guid outletId, CancellationToken cancellationToken)
    {
        var outlet = await _context.Outlets
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == outletId && o.IsActive, cancellationToken);
        if (outlet == null)
            return null;

        var bfQuery = _context.StockBFs
            .AsNoTracking()
            .Where(s => s.OutletId == outletId && s.IsActive &&
                        (s.Status == StockBFStatus.Approved || s.Status == StockBFStatus.Adjusted));

        var maxDate = await bfQuery
            .Select(s => (DateTime?)s.BFDate)
            .MaxAsync(cancellationToken);

        int? lineCount = null;
        DateTime? bfUpdated = null;
        if (maxDate != null)
        {
            lineCount = await bfQuery.CountAsync(s => s.BFDate == maxDate, cancellationToken);
            bfUpdated = await bfQuery.Where(s => s.BFDate == maxDate).MaxAsync(s => (DateTime?)s.UpdatedAt, cancellationToken);
        }

        return new ShowroomOpenStockDetailDto
        {
            Id = outletId,
            OutletId = outletId,
            OutletCode = outlet.Code,
            OutletName = outlet.Name,
            StockAsAt = maxDate,
            BfLineCount = lineCount,
            IsActive = true,
            CreatedAt = outlet.CreatedAt,
            UpdatedAt = bfUpdated ?? outlet.UpdatedAt
        };
    }
}
