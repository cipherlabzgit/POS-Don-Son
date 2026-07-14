using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.GridConfigurations;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class GridConfigurationService : IGridConfigurationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public GridConfigurationService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<GridConfigurationListDto> gridConfigurations, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.GridConfigurations.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(gc => gc.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(gc =>
                gc.GridName.Contains(searchTerm) ||
                (gc.ConfigurationName != null && gc.ConfigurationName.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var gridConfigurations = await query
            .OrderBy(gc => gc.GridName)
            .ThenBy(gc => gc.ConfigurationName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var gridConfigurationDtos = _mapper.Map<List<GridConfigurationListDto>>(gridConfigurations);

        return (gridConfigurationDtos, totalCount);
    }

    public async Task<GridConfigurationDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var gridConfiguration = await _context.GridConfigurations
            .FirstOrDefaultAsync(gc => gc.Id == id, cancellationToken);

        if (gridConfiguration == null)
        {
            return null;
        }

        return _mapper.Map<GridConfigurationDetailDto>(gridConfiguration);
    }

    public async Task<GridConfigurationDetailDto> CreateAsync(
        GridConfigurationCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var gridConfiguration = _mapper.Map<GridConfiguration>(dto);
        gridConfiguration.CreatedById = userId;
        gridConfiguration.UpdatedById = userId;

        _context.GridConfigurations.Add(gridConfiguration);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("GridConfigurationService", $"Grid configuration created: {gridConfiguration.GridName} by user {userId}");

        return _mapper.Map<GridConfigurationDetailDto>(gridConfiguration);
    }

    public async Task<GridConfigurationDetailDto> UpdateAsync(
        Guid id,
        GridConfigurationUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var gridConfiguration = await _context.GridConfigurations.FindAsync(new object[] { id }, cancellationToken);
        if (gridConfiguration == null)
        {
            throw new InvalidOperationException("Grid configuration not found");
        }

        gridConfiguration.GridName = dto.GridName;
        gridConfiguration.UserId = dto.UserId;
        gridConfiguration.ConfigurationName = dto.ConfigurationName;
        gridConfiguration.ColumnSettings = dto.ColumnSettings;
        gridConfiguration.SortSettings = dto.SortSettings;
        gridConfiguration.FilterSettings = dto.FilterSettings;
        gridConfiguration.PageSize = dto.PageSize;
        gridConfiguration.IsDefault = dto.IsDefault;
        gridConfiguration.IsShared = dto.IsShared;
        gridConfiguration.IsActive = dto.IsActive;
        gridConfiguration.UpdatedById = userId;
        gridConfiguration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("GridConfigurationService", $"Grid configuration updated: {gridConfiguration.GridName} by user {userId}");

        return _mapper.Map<GridConfigurationDetailDto>(gridConfiguration);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var gridConfiguration = await _context.GridConfigurations
            .FirstOrDefaultAsync(gc => gc.Id == id, cancellationToken);

        if (gridConfiguration == null)
        {
            throw new InvalidOperationException("Grid configuration not found");
        }

        gridConfiguration.IsActive = false;
        gridConfiguration.UpdatedById = userId;
        gridConfiguration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("GridConfigurationService", $"Grid configuration soft-deleted: {gridConfiguration.GridName} by user {userId}");
    }
}
