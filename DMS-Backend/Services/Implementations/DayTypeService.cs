using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DayTypes;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class DayTypeService : IDayTypeService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DayTypeService> _logger;

    public DayTypeService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<DayTypeService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<DayTypeListDto> dayTypes, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.DayTypes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(dt =>
                dt.Code.Contains(search) ||
                dt.Name.Contains(search));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(dt => dt.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var entities = await query
            .OrderBy(dt => dt.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dayTypes = _mapper.Map<List<DayTypeListDto>>(entities);

        return (dayTypes, totalCount);
    }

    public async Task<DayTypeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dayType = await _context.DayTypes
            .FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);

        return dayType == null ? null : _mapper.Map<DayTypeDetailDto>(dayType);
    }

    public async Task<DayTypeDetailDto> CreateAsync(CreateDayTypeDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Day type with code '{dto.Code}' already exists.");
        }

        var dayType = _mapper.Map<DayType>(dto);
        dayType.Id = Guid.NewGuid();
        dayType.CreatedById = userId;
        dayType.UpdatedById = userId;
        dayType.CreatedAt = DateTime.UtcNow;
        dayType.UpdatedAt = DateTime.UtcNow;

        _context.DayTypes.Add(dayType);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Day type created: {Code} - {Name} (Multiplier: {Multiplier})", 
            dayType.Code, dayType.Name, dayType.Multiplier);

        return (await GetByIdAsync(dayType.Id, cancellationToken))!;
    }

    public async Task<DayTypeDetailDto> UpdateAsync(Guid id, UpdateDayTypeDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var dayType = await _context.DayTypes.FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);
        if (dayType == null)
        {
            throw new InvalidOperationException($"Day type with ID '{id}' not found.");
        }

        if (await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Day type with code '{dto.Code}' already exists.");
        }

        _mapper.Map(dto, dayType);
        dayType.UpdatedById = userId;
        dayType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Day type updated: {Code} - {Name}", dayType.Code, dayType.Name);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dayType = await _context.DayTypes.FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);
        if (dayType == null)
        {
            throw new InvalidOperationException($"Day type with ID '{id}' not found.");
        }

        dayType.IsActive = false;
        dayType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Day type soft-deleted: {Code} - {Name}", dayType.Code, dayType.Name);
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.DayTypes.IgnoreQueryFilters().Where(dt => dt.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(dt => dt.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
