using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.LabelSettings;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class LabelSettingService : ILabelSettingService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public LabelSettingService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<LabelSettingListDto> labelSettings, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.LabelSettings.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(ls => ls.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(ls =>
                ls.SettingKey.Contains(searchTerm) ||
                ls.SettingName.Contains(searchTerm) ||
                (ls.Category != null && ls.Category.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var labelSettings = await query
            .OrderBy(ls => ls.Category)
            .ThenBy(ls => ls.SortOrder)
            .ThenBy(ls => ls.SettingKey)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var labelSettingDtos = _mapper.Map<List<LabelSettingListDto>>(labelSettings);

        return (labelSettingDtos, totalCount);
    }

    public async Task<LabelSettingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var labelSetting = await _context.LabelSettings
            .FirstOrDefaultAsync(ls => ls.Id == id, cancellationToken);

        if (labelSetting == null)
        {
            return null;
        }

        return _mapper.Map<LabelSettingDetailDto>(labelSetting);
    }

    public async Task<LabelSettingDetailDto> CreateAsync(
        LabelSettingCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await SettingKeyExistsAsync(dto.SettingKey, null, cancellationToken))
        {
            throw new InvalidOperationException($"Label setting with key '{dto.SettingKey}' already exists");
        }

        var labelSetting = _mapper.Map<LabelSetting>(dto);
        labelSetting.CreatedById = userId;
        labelSetting.UpdatedById = userId;

        _context.LabelSettings.Add(labelSetting);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelSettingService", $"Label setting created: {labelSetting.SettingKey} by user {userId}");

        return _mapper.Map<LabelSettingDetailDto>(labelSetting);
    }

    public async Task<LabelSettingDetailDto> UpdateAsync(
        Guid id,
        LabelSettingUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var labelSetting = await _context.LabelSettings.FindAsync(new object[] { id }, cancellationToken);
        if (labelSetting == null)
        {
            throw new InvalidOperationException("Label setting not found");
        }

        if (labelSetting.SettingKey != dto.SettingKey && await SettingKeyExistsAsync(dto.SettingKey, id, cancellationToken))
        {
            throw new InvalidOperationException($"Label setting with key '{dto.SettingKey}' already exists");
        }

        labelSetting.SettingKey = dto.SettingKey;
        labelSetting.SettingName = dto.SettingName;
        labelSetting.SettingValue = dto.SettingValue;
        labelSetting.Description = dto.Description;
        labelSetting.Category = dto.Category;
        labelSetting.ValueType = dto.ValueType;
        labelSetting.SortOrder = dto.SortOrder;
        labelSetting.IsSystemSetting = dto.IsSystemSetting;
        labelSetting.IsActive = dto.IsActive;
        labelSetting.UpdatedById = userId;
        labelSetting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelSettingService", $"Label setting updated: {labelSetting.SettingKey} by user {userId}");

        return _mapper.Map<LabelSettingDetailDto>(labelSetting);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var labelSetting = await _context.LabelSettings
            .FirstOrDefaultAsync(ls => ls.Id == id, cancellationToken);

        if (labelSetting == null)
        {
            throw new InvalidOperationException("Label setting not found");
        }

        if (labelSetting.IsSystemSetting)
        {
            throw new InvalidOperationException("Cannot delete system settings");
        }

        labelSetting.IsActive = false;
        labelSetting.UpdatedById = userId;
        labelSetting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelSettingService", $"Label setting soft-deleted: {labelSetting.SettingKey} by user {userId}");
    }

    public async Task<bool> SettingKeyExistsAsync(
        string settingKey,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.LabelSettings.Where(ls => ls.SettingKey == settingKey);

        if (excludeId.HasValue)
        {
            query = query.Where(ls => ls.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
