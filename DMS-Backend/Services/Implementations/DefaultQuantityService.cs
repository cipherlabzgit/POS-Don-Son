using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DefaultQuantities;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class DefaultQuantityService : IDefaultQuantityService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DefaultQuantityService> _logger;

    public DefaultQuantityService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<DefaultQuantityService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<DefaultQuantityListDto> defaultQuantities, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId = null,
        Guid? dayTypeId = null,
        Guid? productId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<DefaultQuantity>()
            .Include(dq => dq.Outlet)
            .Include(dq => dq.DayType)
            .Include(dq => dq.Product)
            .AsQueryable();

        if (outletId.HasValue)
        {
            query = query.Where(dq => dq.OutletId == outletId.Value);
        }

        if (dayTypeId.HasValue)
        {
            query = query.Where(dq => dq.DayTypeId == dayTypeId.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(dq => dq.ProductId == productId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var defaultQuantities = await query
            .OrderBy(dq => dq.Outlet!.Name)
            .ThenBy(dq => dq.DayType!.Name)
            .ThenBy(dq => dq.Product!.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(dq => new DefaultQuantityListDto
            {
                Id = dq.Id,
                OutletId = dq.OutletId,
                OutletName = dq.Outlet!.Name,
                DayTypeId = dq.DayTypeId,
                DayTypeName = dq.DayType!.Name,
                ProductId = dq.ProductId,
                ProductName = dq.Product!.Name,
                FullQuantity = dq.FullQuantity,
                MiniQuantity = dq.MiniQuantity,
                UpdatedAt = dq.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return (defaultQuantities, totalCount);
    }

    public async Task<DefaultQuantityDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _context.Set<DefaultQuantity>()
            .Include(dq => dq.Outlet)
            .Include(dq => dq.DayType)
            .Include(dq => dq.Product)
            .FirstOrDefaultAsync(dq => dq.Id == id, cancellationToken);

        if (defaultQuantity == null)
        {
            return null;
        }

        return new DefaultQuantityDetailDto
        {
            Id = defaultQuantity.Id,
            OutletId = defaultQuantity.OutletId,
            OutletName = defaultQuantity.Outlet!.Name,
            DayTypeId = defaultQuantity.DayTypeId,
            DayTypeName = defaultQuantity.DayType!.Name,
            ProductId = defaultQuantity.ProductId,
            ProductName = defaultQuantity.Product!.Name,
            FullQuantity = defaultQuantity.FullQuantity,
            MiniQuantity = defaultQuantity.MiniQuantity,
            IsActive = defaultQuantity.IsActive,
            CreatedAt = defaultQuantity.CreatedAt,
            UpdatedAt = defaultQuantity.UpdatedAt,
            CreatedById = defaultQuantity.CreatedById,
            UpdatedById = defaultQuantity.UpdatedById
        };
    }

    public async Task<DefaultQuantityDetailDto?> GetByCompositeKeyAsync(
        Guid outletId,
        Guid dayTypeId,
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _context.Set<DefaultQuantity>()
            .Include(dq => dq.Outlet)
            .Include(dq => dq.DayType)
            .Include(dq => dq.Product)
            .FirstOrDefaultAsync(dq =>
                dq.OutletId == outletId &&
                dq.DayTypeId == dayTypeId &&
                dq.ProductId == productId,
                cancellationToken);

        if (defaultQuantity == null)
        {
            return null;
        }

        return new DefaultQuantityDetailDto
        {
            Id = defaultQuantity.Id,
            OutletId = defaultQuantity.OutletId,
            OutletName = defaultQuantity.Outlet!.Name,
            DayTypeId = defaultQuantity.DayTypeId,
            DayTypeName = defaultQuantity.DayType!.Name,
            ProductId = defaultQuantity.ProductId,
            ProductName = defaultQuantity.Product!.Name,
            FullQuantity = defaultQuantity.FullQuantity,
            MiniQuantity = defaultQuantity.MiniQuantity,
            IsActive = defaultQuantity.IsActive,
            CreatedAt = defaultQuantity.CreatedAt,
            UpdatedAt = defaultQuantity.UpdatedAt,
            CreatedById = defaultQuantity.CreatedById,
            UpdatedById = defaultQuantity.UpdatedById
        };
    }

    public async Task<DefaultQuantityDetailDto> CreateAsync(
        CreateDefaultQuantityDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var exists = await _context.Set<DefaultQuantity>()
            .AnyAsync(dq =>
                dq.OutletId == dto.OutletId &&
                dq.DayTypeId == dto.DayTypeId &&
                dq.ProductId == dto.ProductId,
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                $"Default quantity already exists for this outlet, day type, and product combination.");
        }

        var defaultQuantity = _mapper.Map<DefaultQuantity>(dto);
        defaultQuantity.Id = Guid.NewGuid();
        defaultQuantity.CreatedById = userId;
        defaultQuantity.UpdatedById = userId;
        defaultQuantity.CreatedAt = DateTime.UtcNow;
        defaultQuantity.UpdatedAt = DateTime.UtcNow;

        _context.Set<DefaultQuantity>().Add(defaultQuantity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Default quantity created: Outlet={OutletId}, DayType={DayTypeId}, Product={ProductId}",
            dto.OutletId, dto.DayTypeId, dto.ProductId);

        return (await GetByIdAsync(defaultQuantity.Id, cancellationToken))!;
    }

    public async Task<DefaultQuantityDetailDto> UpdateAsync(
        Guid id,
        UpdateDefaultQuantityDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _context.Set<DefaultQuantity>()
            .FirstOrDefaultAsync(dq => dq.Id == id, cancellationToken);

        if (defaultQuantity == null)
        {
            throw new InvalidOperationException($"Default quantity with ID '{id}' not found.");
        }

        defaultQuantity.FullQuantity = dto.FullQuantity;
        defaultQuantity.MiniQuantity = dto.MiniQuantity;
        defaultQuantity.UpdatedById = userId;
        defaultQuantity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Default quantity updated: ID={Id}", id);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var defaultQuantity = await _context.Set<DefaultQuantity>()
            .FirstOrDefaultAsync(dq => dq.Id == id, cancellationToken);

        if (defaultQuantity == null)
        {
            throw new InvalidOperationException($"Default quantity with ID '{id}' not found.");
        }

        defaultQuantity.IsActive = false;
        defaultQuantity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Default quantity soft-deleted: ID={Id}", id);
    }

    public async Task<IEnumerable<DefaultQuantityDetailDto>> BulkUpsertAsync(
        List<BulkUpsertDefaultQuantityDto> dtos,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var results = new List<DefaultQuantityDetailDto>();

        foreach (var dto in dtos)
        {
            var existing = await _context.Set<DefaultQuantity>()
                .FirstOrDefaultAsync(dq =>
                    dq.OutletId == dto.OutletId &&
                    dq.DayTypeId == dto.DayTypeId &&
                    dq.ProductId == dto.ProductId,
                    cancellationToken);

            if (existing != null)
            {
                existing.FullQuantity = dto.FullQuantity;
                existing.MiniQuantity = dto.MiniQuantity;
                existing.UpdatedById = userId;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                results.Add((await GetByIdAsync(existing.Id, cancellationToken))!);
            }
            else
            {
                var defaultQuantity = new DefaultQuantity
                {
                    Id = Guid.NewGuid(),
                    OutletId = dto.OutletId,
                    DayTypeId = dto.DayTypeId,
                    ProductId = dto.ProductId,
                    FullQuantity = dto.FullQuantity,
                    MiniQuantity = dto.MiniQuantity,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Set<DefaultQuantity>().Add(defaultQuantity);
                await _context.SaveChangesAsync(cancellationToken);
                results.Add((await GetByIdAsync(defaultQuantity.Id, cancellationToken))!);
            }
        }

        _logger.LogInformation("Bulk upsert completed: {Count} default quantities processed", dtos.Count);

        return results;
    }
}
