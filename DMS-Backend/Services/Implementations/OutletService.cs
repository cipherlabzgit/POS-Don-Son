using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Outlets;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class OutletService : IOutletService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<OutletService> _logger;

    public OutletService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<OutletService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<OutletListDto> outlets, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        string? locationType = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Outlets.AsQueryable();

        // If activeOnly is not true, ignore the global query filter to include inactive outlets
        if (activeOnly != true)
        {
            query = query.IgnoreQueryFilters();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o =>
                o.Code.Contains(search) ||
                o.Name.Contains(search) ||
                (o.Address != null && o.Address.Contains(search)) ||
                (o.ContactPerson != null && o.ContactPerson.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(locationType))
        {
            query = query.Where(o => o.LocationType == locationType);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var outlets = await query
            .Include(o => o.DefaultDeliveryTurn)
            .OrderBy(o => o.DisplayOrder) // Sort by DisplayOrder (rank)
            .ThenBy(o => o.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<OutletListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (outlets, totalCount);
    }

    public async Task<OutletDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var outlet = await _context.Outlets
            .IgnoreQueryFilters() // Allow fetching inactive outlets
            .Include(o => o.DefaultDeliveryTurn)
            .Include(o => o.OutletEmployees.Where(e => e.IsActive))
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        return outlet == null ? null : _mapper.Map<OutletDetailDto>(outlet);
    }

    public async Task<OutletDetailDto> CreateAsync(CreateOutletDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Outlet with code '{dto.Code}' already exists.");
        }

        var outlet = _mapper.Map<Outlet>(dto);
        outlet.Id = Guid.NewGuid();
        outlet.CreatedById = userId;
        outlet.UpdatedById = userId;
        outlet.CreatedAt = DateTime.UtcNow;
        outlet.UpdatedAt = DateTime.UtcNow;

        _context.Outlets.Add(outlet);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet created: {Code} - {Name} (DisplayOrder: {DisplayOrder})", 
            outlet.Code, outlet.Name, outlet.DisplayOrder);

        return (await GetByIdAsync(outlet.Id, cancellationToken))!;
    }

    public async Task<OutletDetailDto> UpdateAsync(Guid id, UpdateOutletDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        // Use IgnoreQueryFilters to find inactive outlets as well (needed for reactivation)
        var outlet = await _context.Outlets
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        
        if (outlet == null)
        {
            throw new InvalidOperationException($"Outlet with ID '{id}' not found.");
        }

        if (await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Outlet with code '{dto.Code}' already exists.");
        }

        _mapper.Map(dto, outlet);
        outlet.UpdatedById = userId;
        outlet.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet updated: {Code} - {Name} (DisplayOrder: {DisplayOrder})", 
            outlet.Code, outlet.Name, outlet.DisplayOrder);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Use IgnoreQueryFilters to find the outlet even if already inactive
        var outlet = await _context.Outlets
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        
        if (outlet == null)
        {
            throw new InvalidOperationException($"Outlet with ID '{id}' not found.");
        }

        outlet.IsActive = false;
        outlet.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet soft-deleted: {Code} - {Name}", outlet.Code, outlet.Name);
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Outlets.IgnoreQueryFilters().Where(o => o.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(o => o.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
