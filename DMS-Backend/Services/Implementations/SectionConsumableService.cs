using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.SectionConsumables;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class SectionConsumableService : ISectionConsumableService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SectionConsumableService> _logger;

    public SectionConsumableService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<SectionConsumableService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<SectionConsumableListDto> sectionConsumables, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? productionSectionId = null,
        Guid? ingredientId = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SectionConsumables
            .Include(sc => sc.ProductionSection)
            .Include(sc => sc.Ingredient)
            .AsQueryable();

        if (productionSectionId.HasValue)
        {
            query = query.Where(sc => sc.ProductionSectionId == productionSectionId.Value);
        }

        if (ingredientId.HasValue)
        {
            query = query.Where(sc => sc.IngredientId == ingredientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(sc =>
                sc.ProductionSection.Name.Contains(search) ||
                sc.Ingredient.Name.Contains(search) ||
                (sc.Formula != null && sc.Formula.Contains(search)));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(sc => sc.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var sectionConsumables = await query
            .OrderBy(sc => sc.ProductionSection.Name)
            .ThenBy(sc => sc.Ingredient.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<SectionConsumableListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (sectionConsumables, totalCount);
    }

    public async Task<SectionConsumableDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sectionConsumable = await _context.SectionConsumables
            .Include(sc => sc.ProductionSection)
            .Include(sc => sc.Ingredient)
            .FirstOrDefaultAsync(sc => sc.Id == id, cancellationToken);

        return sectionConsumable == null ? null : _mapper.Map<SectionConsumableDetailDto>(sectionConsumable);
    }

    public async Task<SectionConsumableDetailDto> CreateAsync(CreateSectionConsumableDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var exists = await _context.SectionConsumables
            .IgnoreQueryFilters()
            .AnyAsync(sc => sc.ProductionSectionId == dto.ProductionSectionId && sc.IngredientId == dto.IngredientId, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Section consumable already exists for this production section and ingredient combination.");
        }

        var sectionConsumable = _mapper.Map<SectionConsumable>(dto);
        sectionConsumable.Id = Guid.NewGuid();
        sectionConsumable.CreatedById = userId;
        sectionConsumable.UpdatedById = userId;
        sectionConsumable.CreatedAt = DateTime.UtcNow;
        sectionConsumable.UpdatedAt = DateTime.UtcNow;

        _context.SectionConsumables.Add(sectionConsumable);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Section consumable created for section {SectionId} and ingredient {IngredientId}", 
            sectionConsumable.ProductionSectionId, sectionConsumable.IngredientId);

        return (await GetByIdAsync(sectionConsumable.Id, cancellationToken))!;
    }

    public async Task<SectionConsumableDetailDto> UpdateAsync(Guid id, UpdateSectionConsumableDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var sectionConsumable = await _context.SectionConsumables.FirstOrDefaultAsync(sc => sc.Id == id, cancellationToken);
        if (sectionConsumable == null)
        {
            throw new InvalidOperationException($"Section consumable with ID '{id}' not found.");
        }

        var exists = await _context.SectionConsumables
            .IgnoreQueryFilters()
            .AnyAsync(sc => sc.Id != id && sc.ProductionSectionId == dto.ProductionSectionId && sc.IngredientId == dto.IngredientId, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Section consumable already exists for this production section and ingredient combination.");
        }

        _mapper.Map(dto, sectionConsumable);
        sectionConsumable.UpdatedById = userId;
        sectionConsumable.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Section consumable updated: {Id}", sectionConsumable.Id);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sectionConsumable = await _context.SectionConsumables.FirstOrDefaultAsync(sc => sc.Id == id, cancellationToken);
        if (sectionConsumable == null)
        {
            throw new InvalidOperationException($"Section consumable with ID '{id}' not found.");
        }

        sectionConsumable.IsActive = false;
        sectionConsumable.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Section consumable soft-deleted: {Id}", sectionConsumable.Id);
    }
}
