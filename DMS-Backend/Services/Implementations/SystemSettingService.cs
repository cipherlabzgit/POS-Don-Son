using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.SystemSettings;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class SystemSettingService : ISystemSettingService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SystemSettingService> _logger;

    public SystemSettingService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<SystemSettingService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<SystemSettingListDto> settings, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? category = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SystemSettings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(ss => ss.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(ss =>
                ss.SettingKey.Contains(search) ||
                ss.SettingName.Contains(search) ||
                (ss.Description != null && ss.Description.Contains(search)));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(ss => ss.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var settings = await query
            .OrderBy(ss => ss.Category)
            .ThenBy(ss => ss.DisplayOrder)
            .ThenBy(ss => ss.SettingName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<SystemSettingListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (settings, totalCount);
    }

    public async Task<SystemSettingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(ss => ss.Id == id, cancellationToken);

        return setting == null ? null : _mapper.Map<SystemSettingDetailDto>(setting);
    }

    public async Task<SystemSettingDetailDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(ss => ss.SettingKey == key, cancellationToken);

        return setting == null ? null : _mapper.Map<SystemSettingDetailDto>(setting);
    }

    public async Task<SystemSettingDetailDto> CreateAsync(CreateSystemSettingDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await KeyExistsAsync(dto.SettingKey, null, cancellationToken))
        {
            throw new InvalidOperationException($"System setting with key '{dto.SettingKey}' already exists.");
        }

        var setting = _mapper.Map<SystemSetting>(dto);
        setting.Id = Guid.NewGuid();
        setting.CreatedById = userId;
        setting.UpdatedById = userId;
        setting.CreatedAt = DateTime.UtcNow;
        setting.UpdatedAt = DateTime.UtcNow;

        _context.SystemSettings.Add(setting);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("System setting created: {Key} = {Value}", setting.SettingKey, setting.SettingValue);

        return (await GetByIdAsync(setting.Id, cancellationToken))!;
    }

    public async Task<SystemSettingDetailDto> UpdateAsync(Guid id, UpdateSystemSettingDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(ss => ss.Id == id, cancellationToken);
        if (setting == null)
        {
            throw new InvalidOperationException($"System setting with ID '{id}' not found.");
        }

        if (await KeyExistsAsync(dto.SettingKey, id, cancellationToken))
        {
            throw new InvalidOperationException($"System setting with key '{dto.SettingKey}' already exists.");
        }

        _mapper.Map(dto, setting);
        setting.UpdatedById = userId;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("System setting updated: {Key} = {Value}", setting.SettingKey, setting.SettingValue);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<SystemSettingDetailDto> UpdateValueByKeyAsync(
        string settingKey,
        UpdateSystemSettingValueDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(settingKey))
        {
            throw new InvalidOperationException("Setting key is required.");
        }

        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(ss => ss.SettingKey == settingKey, cancellationToken);
        if (setting == null)
        {
            throw new InvalidOperationException($"System setting with key '{settingKey}' was not found.");
        }

        var raw = dto.SettingValue?.Trim() ?? string.Empty;
        if (string.Equals(setting.SettingType, "Number", StringComparison.OrdinalIgnoreCase))
        {
            if (!int.TryParse(raw, out var n) || n is < 0 or > 1)
            {
                throw new InvalidOperationException("Value must be 0 or 1 for this setting.");
            }

            raw = n.ToString();
        }

        setting.SettingValue = string.IsNullOrEmpty(raw) ? null : raw;
        setting.UpdatedById = userId;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("System setting value updated: {Key} = {Value}", setting.SettingKey, setting.SettingValue);

        return (await GetByIdAsync(setting.Id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(ss => ss.Id == id, cancellationToken);
        if (setting == null)
        {
            throw new InvalidOperationException($"System setting with ID '{id}' not found.");
        }

        if (setting.IsSystemSetting)
        {
            throw new InvalidOperationException("Cannot delete system settings.");
        }

        setting.IsActive = false;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("System setting soft-deleted: {Key}", setting.SettingKey);
    }

    public async Task<bool> KeyExistsAsync(string key, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SystemSettings.IgnoreQueryFilters().Where(ss => ss.SettingKey == key);

        if (excludeId.HasValue)
        {
            query = query.Where(ss => ss.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
