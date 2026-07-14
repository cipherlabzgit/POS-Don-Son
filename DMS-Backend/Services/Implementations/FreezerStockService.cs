using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class FreezerStockService : IFreezerStockService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<FreezerStockService> _logger;

    public FreezerStockService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<FreezerStockService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<FreezerStockListDto> stocks, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? productId = null,
        Guid? productionSectionId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<FreezerStock>()
            .Include(fs => fs.Product)
            .Include(fs => fs.ProductionSection)
            .AsQueryable();

        if (productId.HasValue)
        {
            query = query.Where(fs => fs.ProductId == productId.Value);
        }

        if (productionSectionId.HasValue)
        {
            query = query.Where(fs => fs.ProductionSectionId == productionSectionId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var stocks = await query
            .OrderBy(fs => fs.Product!.Name)
            .ThenBy(fs => fs.ProductionSection!.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(fs => new FreezerStockListDto
            {
                Id = fs.Id,
                ProductId = fs.ProductId,
                ProductName = fs.Product!.Name,
                ProductionSectionId = fs.ProductionSectionId,
                ProductionSectionName = fs.ProductionSection!.Name,
                CurrentStock = fs.CurrentStock,
                LastUpdatedBy = fs.LastUpdatedBy,
                LastUpdatedAt = fs.LastUpdatedAt
            })
            .ToListAsync(cancellationToken);

        return (stocks, totalCount);
    }

    public async Task<FreezerStockDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var stock = await _context.Set<FreezerStock>()
            .Include(fs => fs.Product)
            .Include(fs => fs.ProductionSection)
            .FirstOrDefaultAsync(fs => fs.Id == id, cancellationToken);

        if (stock == null)
        {
            return null;
        }

        return new FreezerStockDetailDto
        {
            Id = stock.Id,
            ProductId = stock.ProductId,
            ProductName = stock.Product!.Name,
            ProductionSectionId = stock.ProductionSectionId,
            ProductionSectionName = stock.ProductionSection!.Name,
            CurrentStock = stock.CurrentStock,
            LastUpdatedBy = stock.LastUpdatedBy,
            LastUpdatedAt = stock.LastUpdatedAt,
            IsActive = stock.IsActive,
            CreatedAt = stock.CreatedAt,
            UpdatedAt = stock.UpdatedAt,
            CreatedById = stock.CreatedById,
            UpdatedById = stock.UpdatedById
        };
    }

    public async Task<FreezerStockDetailDto?> GetCurrentStockAsync(
        Guid productId,
        Guid productionSectionId,
        CancellationToken cancellationToken = default)
    {
        var stock = await _context.Set<FreezerStock>()
            .Include(fs => fs.Product)
            .Include(fs => fs.ProductionSection)
            .FirstOrDefaultAsync(fs =>
                fs.ProductId == productId &&
                fs.ProductionSectionId == productionSectionId,
                cancellationToken);

        if (stock == null)
        {
            return null;
        }

        return await GetByIdAsync(stock.Id, cancellationToken);
    }

    public async Task<FreezerStockDetailDto> AdjustStockAsync(
        AdjustFreezerStockDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var stock = await _context.Set<FreezerStock>()
            .FirstOrDefaultAsync(fs =>
                fs.ProductId == dto.ProductId &&
                fs.ProductionSectionId == dto.ProductionSectionId,
                cancellationToken);

        var previousStock = stock?.CurrentStock ?? 0;
        var newStock = previousStock + dto.Quantity;

        if (newStock < 0)
        {
            throw new InvalidOperationException("Stock cannot be negative after this adjustment.");
        }

        if (stock == null)
        {
            stock = new FreezerStock
            {
                Id = Guid.NewGuid(),
                ProductId = dto.ProductId,
                ProductionSectionId = dto.ProductionSectionId,
                CurrentStock = newStock,
                LastUpdatedBy = userId,
                LastUpdatedAt = DateTime.UtcNow,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Set<FreezerStock>().Add(stock);
        }
        else
        {
            stock.CurrentStock = newStock;
            stock.LastUpdatedBy = userId;
            stock.LastUpdatedAt = DateTime.UtcNow;
            stock.UpdatedById = userId;
            stock.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var history = new FreezerStockHistory
        {
            Id = Guid.NewGuid(),
            FreezerStockId = stock.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = dto.TransactionType,
            Quantity = dto.Quantity,
            PreviousStock = previousStock,
            NewStock = newStock,
            Reason = dto.Reason,
            ReferenceNo = dto.ReferenceNo,
            CreatedById = userId,
            UpdatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Set<FreezerStockHistory>().Add(history);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Freezer stock adjusted: Product={ProductId}, Section={SectionId}, {TransactionType} {Quantity}, New Stock={NewStock}",
            dto.ProductId, dto.ProductionSectionId, dto.TransactionType, dto.Quantity, newStock);

        return (await GetByIdAsync(stock.Id, cancellationToken))!;
    }

    public async Task<FreezerStockDetailDto> SetStockAsync(
        AdjustFreezerStockDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var stock = await _context.Set<FreezerStock>()
            .FirstOrDefaultAsync(fs =>
                fs.ProductId == dto.ProductId &&
                fs.ProductionSectionId == dto.ProductionSectionId,
                cancellationToken);

        var previousStock = stock?.CurrentStock ?? 0;
        var newStock = dto.Quantity;

        if (newStock < 0)
            throw new InvalidOperationException("Stock cannot be set to a negative value.");

        if (stock == null)
        {
            stock = new FreezerStock
            {
                Id = Guid.NewGuid(),
                ProductId = dto.ProductId,
                ProductionSectionId = dto.ProductionSectionId,
                CurrentStock = newStock,
                LastUpdatedBy = userId,
                LastUpdatedAt = DateTime.UtcNow,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
            _context.Set<FreezerStock>().Add(stock);
        }
        else
        {
            stock.CurrentStock = newStock;
            stock.LastUpdatedBy = userId;
            stock.LastUpdatedAt = DateTime.UtcNow;
            stock.UpdatedById = userId;
            stock.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var history = new FreezerStockHistory
        {
            Id = Guid.NewGuid(),
            FreezerStockId = stock.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = dto.TransactionType,
            Quantity = newStock - previousStock,
            PreviousStock = previousStock,
            NewStock = newStock,
            Reason = dto.Reason,
            ReferenceNo = dto.ReferenceNo,
            CreatedById = userId,
            UpdatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Set<FreezerStockHistory>().Add(history);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Freezer stock set: Product={ProductId}, Section={SectionId}, {TransactionType}, New Stock={NewStock}",
            dto.ProductId, dto.ProductionSectionId, dto.TransactionType, newStock);

        return (await GetByIdAsync(stock.Id, cancellationToken))!;
    }

    public async Task<IEnumerable<FreezerStockHistoryDto>> GetHistoryAsync(
        Guid productId,
        Guid productionSectionId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var stock = await _context.Set<FreezerStock>()
            .FirstOrDefaultAsync(fs =>
                fs.ProductId == productId &&
                fs.ProductionSectionId == productionSectionId,
                cancellationToken);

        if (stock == null)
        {
            return new List<FreezerStockHistoryDto>();
        }

        var query = _context.Set<FreezerStockHistory>()
            .Where(fsh => fsh.FreezerStockId == stock.Id)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(fsh => fsh.TransactionDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(fsh => fsh.TransactionDate <= toDate.Value);
        }

        var history = await query
            .OrderByDescending(fsh => fsh.TransactionDate)
            .Select(fsh => new FreezerStockHistoryDto
            {
                Id = fsh.Id,
                FreezerStockId = fsh.FreezerStockId,
                TransactionDate = fsh.TransactionDate,
                TransactionType = fsh.TransactionType,
                Quantity = fsh.Quantity,
                PreviousStock = fsh.PreviousStock,
                NewStock = fsh.NewStock,
                Reason = fsh.Reason,
                ReferenceNo = fsh.ReferenceNo,
                CreatedAt = fsh.CreatedAt,
                CreatedById = fsh.CreatedById
            })
            .ToListAsync(cancellationToken);

        return history;
    }
}
