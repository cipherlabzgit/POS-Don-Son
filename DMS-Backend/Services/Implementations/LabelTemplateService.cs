using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.LabelTemplates;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class LabelTemplateService : ILabelTemplateService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public LabelTemplateService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<LabelTemplateListDto> labelTemplates, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.LabelTemplates
            .Include(lt => lt.LabelPrinter)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(lt => lt.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(lt =>
                lt.Code.Contains(searchTerm) ||
                lt.Name.Contains(searchTerm) ||
                (lt.Description != null && lt.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var labelTemplates = await query
            .OrderBy(lt => lt.SortOrder)
            .ThenBy(lt => lt.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var labelTemplateDtos = _mapper.Map<List<LabelTemplateListDto>>(labelTemplates);

        return (labelTemplateDtos, totalCount);
    }

    public async Task<LabelTemplateDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var labelTemplate = await _context.LabelTemplates
            .Include(lt => lt.LabelPrinter)
            .FirstOrDefaultAsync(lt => lt.Id == id, cancellationToken);

        if (labelTemplate == null)
        {
            return null;
        }

        return _mapper.Map<LabelTemplateDetailDto>(labelTemplate);
    }

    public async Task<LabelTemplateDetailDto> CreateAsync(
        LabelTemplateCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Label template with code '{dto.Code}' already exists");
        }

        if (dto.LabelPrinterId.HasValue)
        {
            var ok = await _context.LabelPrinters.AnyAsync(
                p => p.Id == dto.LabelPrinterId.Value && p.IsActive,
                cancellationToken);
            if (!ok)
            {
                throw new InvalidOperationException("Selected printer was not found or is inactive.");
            }
        }

        var labelTemplate = _mapper.Map<LabelTemplate>(dto);
        labelTemplate.CreatedById = userId;
        labelTemplate.UpdatedById = userId;

        _context.LabelTemplates.Add(labelTemplate);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelTemplateService", $"Label template created: {labelTemplate.Code} by user {userId}");

        return (await GetByIdAsync(labelTemplate.Id, cancellationToken))!;
    }

    public async Task<LabelTemplateDetailDto> UpdateAsync(
        Guid id,
        LabelTemplateUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var labelTemplate = await _context.LabelTemplates.FindAsync(new object[] { id }, cancellationToken);
        if (labelTemplate == null)
        {
            throw new InvalidOperationException("Label template not found");
        }

        if (labelTemplate.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Label template with code '{dto.Code}' already exists");
        }

        if (dto.LabelPrinterId.HasValue)
        {
            var ok = await _context.LabelPrinters.AnyAsync(
                p => p.Id == dto.LabelPrinterId.Value && p.IsActive,
                cancellationToken);
            if (!ok)
            {
                throw new InvalidOperationException("Selected printer was not found or is inactive.");
            }
        }

        labelTemplate.Code = dto.Code;
        labelTemplate.Name = dto.Name;
        labelTemplate.Description = dto.Description;
        labelTemplate.TemplateType = dto.TemplateType;
        labelTemplate.WidthMm = dto.WidthMm;
        labelTemplate.HeightMm = dto.HeightMm;
        labelTemplate.LayoutDesign = dto.LayoutDesign;
        labelTemplate.Fields = dto.Fields;
        labelTemplate.FontSettings = dto.FontSettings;
        labelTemplate.SortOrder = dto.SortOrder;
        labelTemplate.IsDefault = dto.IsDefault;
        labelTemplate.IsActive = dto.IsActive;
        labelTemplate.LabelPrinterId = dto.LabelPrinterId;
        labelTemplate.UpdatedById = userId;
        labelTemplate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelTemplateService", $"Label template updated: {labelTemplate.Code} by user {userId}");

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<LabelTemplateDetailDto> AssignPrinterAsync(
        Guid id,
        AssignLabelTemplatePrinterDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var labelTemplate = await _context.LabelTemplates
            .FirstOrDefaultAsync(lt => lt.Id == id, cancellationToken);
        if (labelTemplate == null)
        {
            throw new InvalidOperationException("Label template not found");
        }

        if (dto.LabelPrinterId.HasValue)
        {
            var ok = await _context.LabelPrinters.AnyAsync(
                p => p.Id == dto.LabelPrinterId.Value && p.IsActive,
                cancellationToken);
            if (!ok)
            {
                throw new InvalidOperationException("Selected printer was not found or is inactive.");
            }
        }

        labelTemplate.LabelPrinterId = dto.LabelPrinterId;
        labelTemplate.UpdatedById = userId;
        labelTemplate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelTemplateService", $"Label template printer assigned: {labelTemplate.Code} by user {userId}");

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var labelTemplate = await _context.LabelTemplates
            .FirstOrDefaultAsync(lt => lt.Id == id, cancellationToken);

        if (labelTemplate == null)
        {
            throw new InvalidOperationException("Label template not found");
        }

        labelTemplate.IsActive = false;
        labelTemplate.UpdatedById = userId;
        labelTemplate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("LabelTemplateService", $"Label template soft-deleted: {labelTemplate.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.LabelTemplates.Where(lt => lt.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(lt => lt.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
