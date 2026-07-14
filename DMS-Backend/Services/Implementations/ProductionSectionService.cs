using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.ProductionSections;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class ProductionSectionService : IProductionSectionService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductionSectionService> _logger;

    public ProductionSectionService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<ProductionSectionService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<ProductionSectionListDto> productionSections, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ProductionSections.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(ps =>
                ps.Code.Contains(search) ||
                ps.Name.Contains(search) ||
                (ps.Location != null && ps.Location.Contains(search)));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(ps => ps.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var productionSections = await query
            .Include(ps => ps.SectionConsumables.Where(sc => sc.IsActive))
            .OrderBy(ps => ps.SortOrder)
            .ThenBy(ps => ps.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<ProductionSectionListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (productionSections, totalCount);
    }

    public async Task<ProductionSectionDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var productionSection = await _context.ProductionSections
            .Include(ps => ps.SectionConsumables.Where(sc => sc.IsActive))
            .FirstOrDefaultAsync(ps => ps.Id == id, cancellationToken);

        return productionSection == null ? null : _mapper.Map<ProductionSectionDetailDto>(productionSection);
    }

    public async Task<ProductionSectionDetailDto> CreateAsync(CreateProductionSectionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Production section with code '{dto.Code}' already exists.");
        }

        var productionSection = _mapper.Map<ProductionSection>(dto);
        productionSection.Id = Guid.NewGuid();
        productionSection.CreatedById = userId;
        productionSection.UpdatedById = userId;
        productionSection.CreatedAt = DateTime.UtcNow;
        productionSection.UpdatedAt = DateTime.UtcNow;

        _context.ProductionSections.Add(productionSection);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Production section created: {Code} - {Name}", productionSection.Code, productionSection.Name);

        return (await GetByIdAsync(productionSection.Id, cancellationToken))!;
    }

    public async Task<ProductionSectionDetailDto> UpdateAsync(Guid id, UpdateProductionSectionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var productionSection = await _context.ProductionSections.FirstOrDefaultAsync(ps => ps.Id == id, cancellationToken);
        if (productionSection == null)
        {
            throw new InvalidOperationException($"Production section with ID '{id}' not found.");
        }

        if (await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Production section with code '{dto.Code}' already exists.");
        }

        _mapper.Map(dto, productionSection);
        productionSection.UpdatedById = userId;
        productionSection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Production section updated: {Code} - {Name}", productionSection.Code, productionSection.Name);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var productionSection = await _context.ProductionSections.FirstOrDefaultAsync(ps => ps.Id == id, cancellationToken);
        if (productionSection == null)
        {
            throw new InvalidOperationException($"Production section with ID '{id}' not found.");
        }

        productionSection.IsActive = false;
        productionSection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Production section soft-deleted: {Code} - {Name}", productionSection.Code, productionSection.Name);
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ProductionSections.IgnoreQueryFilters().Where(ps => ps.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(ps => ps.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
