using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.PosTheme;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DMS_Backend.Services.Implementations;

public class PosThemeConfigService : IPosThemeConfigService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PosThemeConfigService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<(List<PosThemeConfigDto> Themes, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search,
        bool? activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PosThemeConfigs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(t =>
                t.ThemeName.ToLower().Contains(search) ||
                (t.Description != null && t.Description.ToLower().Contains(search)));
        }

        if (activeOnly == true)
        {
            query = query.Where(t => t.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var themes = await query
            .OrderBy(t => t.DisplayOrder)
            .ThenByDescending(t => t.IsActive)
            .ThenBy(t => t.ThemeName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<PosThemeConfigDto>>(themes), totalCount);
    }

    public async Task<PosThemeConfigDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var theme = await _context.PosThemeConfigs
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return theme == null ? null : _mapper.Map<PosThemeConfigDto>(theme);
    }

    public async Task<ActivePosThemeDto> GetActiveThemeAsync(CancellationToken cancellationToken = default)
    {
        // Find the active theme (PosThemeConfig.IsActive = true)
        var activeTheme = await _context.PosThemeConfigs
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .FirstOrDefaultAsync(cancellationToken);

        var defaultCategoryColors = new List<string>
        {
            "#ffd100", "#c8102e", "#16a34a", "#1d4ed8",
            "#9333ea", "#ea580c", "#db2777", "#0891b2"
        };

        if (activeTheme == null)
        {
            // Return default Don & Sons theme
            return new ActivePosThemeDto
            {
                PrimaryColor = "#C8102E",
                PrimaryLight = "#E31837",
                PrimaryDark = "#A00D26",
                AccentColor = "#FFD100",
                AccentLight = "#FFDC33",
                AccentDark = "#CCAA00",
                CategoryColors = defaultCategoryColors
            };
        }

        List<string>? categoryColors = null;
        if (!string.IsNullOrWhiteSpace(activeTheme.CategoryColors))
        {
            try
            {
                categoryColors = JsonSerializer.Deserialize<List<string>>(activeTheme.CategoryColors);
            }
            catch
            {
                // If deserialization fails, use default
                categoryColors = null;
            }
        }

        return new ActivePosThemeDto
        {
            PrimaryColor = activeTheme.PrimaryColor,
            PrimaryLight = activeTheme.PrimaryLight ?? "#E31837",
            PrimaryDark = activeTheme.PrimaryDark ?? "#A00D26",
            AccentColor = activeTheme.AccentColor,
            AccentLight = activeTheme.AccentLight ?? "#FFDC33",
            AccentDark = activeTheme.AccentDark ?? "#CCAA00",
            CategoryColors = categoryColors ?? defaultCategoryColors
        };
    }

    public async Task<PosThemeConfigDto> CreateAsync(
        CreatePosThemeConfigDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Check for duplicate name
        var exists = await _context.PosThemeConfigs
            .AnyAsync(t => t.ThemeName.ToLower() == dto.ThemeName.ToLower(),
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Theme with name '{dto.ThemeName}' already exists.");
        }

        var theme = _mapper.Map<PosThemeConfig>(dto);
        theme.CreatedById = userId;
        theme.CreatedAt = DateTime.UtcNow;
        theme.UpdatedAt = DateTime.UtcNow;
        theme.IsActive = false; // New themes start inactive
        theme.IsSystem = false;

        _context.PosThemeConfigs.Add(theme);
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PosThemeConfigDto>(theme);
    }

    public async Task<PosThemeConfigDto> UpdateAsync(
        Guid id,
        UpdatePosThemeConfigDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var theme = await _context.PosThemeConfigs
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (theme == null)
        {
            throw new InvalidOperationException($"Theme with ID {id} not found.");
        }

        // Check for duplicate name if name is being changed
        if (!string.IsNullOrWhiteSpace(dto.ThemeName) && dto.ThemeName != theme.ThemeName)
        {
            var exists = await _context.PosThemeConfigs
                .AnyAsync(t => t.ThemeName.ToLower() == dto.ThemeName.ToLower() && 
                              t.Id != id,
                    cancellationToken);

            if (exists)
            {
                throw new InvalidOperationException($"Theme with name '{dto.ThemeName}' already exists.");
            }

            theme.ThemeName = dto.ThemeName;
        }

        if (dto.Description != null) theme.Description = dto.Description;
        if (dto.PrimaryColor != null) theme.PrimaryColor = dto.PrimaryColor;
        if (dto.PrimaryLight != null) theme.PrimaryLight = dto.PrimaryLight;
        if (dto.PrimaryDark != null) theme.PrimaryDark = dto.PrimaryDark;
        if (dto.AccentColor != null) theme.AccentColor = dto.AccentColor;
        if (dto.AccentLight != null) theme.AccentLight = dto.AccentLight;
        if (dto.AccentDark != null) theme.AccentDark = dto.AccentDark;
        if (dto.CategoryColors != null && dto.CategoryColors.Count > 0) 
            theme.CategoryColors = JsonSerializer.Serialize(dto.CategoryColors);
        if (dto.DisplayOrder.HasValue) theme.DisplayOrder = dto.DisplayOrder.Value;

        theme.UpdatedById = userId;
        theme.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PosThemeConfigDto>(theme);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var theme = await _context.PosThemeConfigs
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (theme == null)
        {
            throw new InvalidOperationException($"Theme with ID {id} not found.");
        }

        if (theme.IsSystem)
        {
            throw new InvalidOperationException("Cannot delete system themes.");
        }

        // Actually remove the theme from database
        _context.PosThemeConfigs.Remove(theme);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PosThemeConfigDto> SetActiveThemeAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var theme = await _context.PosThemeConfigs
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (theme == null)
        {
            throw new InvalidOperationException($"Theme with ID {id} not found.");
        }

        // Deactivate all other themes
        var otherThemes = await _context.PosThemeConfigs
            .Where(t => t.Id != id && t.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var otherTheme in otherThemes)
        {
            otherTheme.IsActive = false;
            otherTheme.UpdatedById = userId;
            otherTheme.UpdatedAt = DateTime.UtcNow;
        }

        // Activate the selected theme
        theme.IsActive = true;
        theme.UpdatedById = userId;
        theme.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PosThemeConfigDto>(theme);
    }
}
