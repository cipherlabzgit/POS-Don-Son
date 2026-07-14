using AutoMapper;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.RoundingRules;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class RoundingRuleService : IRoundingRuleService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public RoundingRuleService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<RoundingRuleListDto> roundingRules, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RoundingRules.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(rr => rr.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(rr =>
                rr.Code.Contains(searchTerm) ||
                rr.Name.Contains(searchTerm) ||
                rr.AppliesTo.Contains(searchTerm) ||
                (rr.Description != null && rr.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var roundingRules = await query
            .OrderBy(rr => rr.AppliesTo)
            .ThenBy(rr => rr.SortOrder)
            .ThenBy(rr => rr.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var roundingRuleDtos = _mapper.Map<List<RoundingRuleListDto>>(roundingRules);

        return (roundingRuleDtos, totalCount);
    }

    public async Task<RoundingRuleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var roundingRule = await _context.RoundingRules
            .FirstOrDefaultAsync(rr => rr.Id == id, cancellationToken);

        if (roundingRule == null)
        {
            return null;
        }

        return _mapper.Map<RoundingRuleDetailDto>(roundingRule);
    }

    public async Task<RoundingRuleDetailDto> CreateAsync(
        RoundingRuleCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Rounding rule with code '{dto.Code}' already exists");
        }

        var roundingRule = _mapper.Map<RoundingRule>(dto);
        roundingRule.CreatedById = userId;
        roundingRule.UpdatedById = userId;

        _context.RoundingRules.Add(roundingRule);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RoundingRuleService", $"Rounding rule created: {roundingRule.Code} by user {userId}");

        return _mapper.Map<RoundingRuleDetailDto>(roundingRule);
    }

    public async Task<RoundingRuleDetailDto> UpdateAsync(
        Guid id,
        RoundingRuleUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var roundingRule = await _context.RoundingRules.FindAsync(new object[] { id }, cancellationToken);
        if (roundingRule == null)
        {
            throw new InvalidOperationException("Rounding rule not found");
        }

        if (roundingRule.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Rounding rule with code '{dto.Code}' already exists");
        }

        roundingRule.Code = dto.Code;
        roundingRule.Name = dto.Name;
        roundingRule.Description = dto.Description;
        roundingRule.AppliesTo = dto.AppliesTo;
        roundingRule.RoundingMethod = dto.RoundingMethod;
        roundingRule.DecimalPlaces = dto.DecimalPlaces;
        roundingRule.RoundingIncrement = dto.RoundingIncrement;
        roundingRule.MinValue = dto.MinValue;
        roundingRule.MaxValue = dto.MaxValue;
        roundingRule.RatioBaseQuantity = dto.RatioBaseQuantity;
        roundingRule.RatioYieldQuantity = dto.RatioYieldQuantity;
        roundingRule.SortOrder = dto.SortOrder;
        roundingRule.IsDefault = dto.IsDefault;
        roundingRule.IsActive = dto.IsActive;
        roundingRule.UpdatedById = userId;
        roundingRule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RoundingRuleService", $"Rounding rule updated: {roundingRule.Code} by user {userId}");

        return _mapper.Map<RoundingRuleDetailDto>(roundingRule);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var roundingRule = await _context.RoundingRules
            .FirstOrDefaultAsync(rr => rr.Id == id, cancellationToken);

        if (roundingRule == null)
        {
            throw new InvalidOperationException("Rounding rule not found");
        }

        roundingRule.IsActive = false;
        roundingRule.UpdatedById = userId;
        roundingRule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RoundingRuleService", $"Rounding rule soft-deleted: {roundingRule.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RoundingRules.Where(rr => rr.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(rr => rr.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public Task<RoundingRulePreviewResponseDto> PreviewAsync(
        RoundingRulePreviewRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var hasRatio = dto.RatioBaseQuantity.HasValue && dto.RatioYieldQuantity.HasValue;
        decimal standard;
        if (hasRatio)
        {
            if (!dto.SampleItemQuantity.HasValue)
                throw new InvalidOperationException("Sample item quantity is required when an item-level ratio is set.");

            standard = RoundingRuleMath.ComputeStandardFromRatio(
                dto.SampleItemQuantity.Value,
                dto.RatioBaseQuantity!.Value,
                dto.RatioYieldQuantity!.Value);
        }
        else
        {
            if (!dto.SampleStandardValue.HasValue)
                throw new InvalidOperationException("Sample standard value is required when no ratio is configured.");

            standard = dto.SampleStandardValue.Value;
        }

        var rounded = RoundingRuleMath.Round(
            standard,
            dto.RoundingMethod,
            dto.RoundingIncrement,
            dto.DecimalPlaces);

        return Task.FromResult(new RoundingRulePreviewResponseDto
        {
            StandardValue = standard,
            RoundedValue = rounded
        });
    }
}
