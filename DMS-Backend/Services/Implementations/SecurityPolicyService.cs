using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.SecurityPolicies;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class SecurityPolicyService : ISecurityPolicyService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public SecurityPolicyService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<SecurityPolicyListDto> securityPolicies, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SecurityPolicies.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(sp => sp.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(sp =>
                sp.PolicyKey.Contains(searchTerm) ||
                sp.PolicyName.Contains(searchTerm) ||
                sp.Category.Contains(searchTerm) ||
                (sp.Description != null && sp.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var securityPolicies = await query
            .OrderBy(sp => sp.Category)
            .ThenBy(sp => sp.SortOrder)
            .ThenBy(sp => sp.PolicyKey)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var securityPolicyDtos = _mapper.Map<List<SecurityPolicyListDto>>(securityPolicies);

        return (securityPolicyDtos, totalCount);
    }

    public async Task<SecurityPolicyDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var securityPolicy = await _context.SecurityPolicies
            .FirstOrDefaultAsync(sp => sp.Id == id, cancellationToken);

        if (securityPolicy == null)
        {
            return null;
        }

        return _mapper.Map<SecurityPolicyDetailDto>(securityPolicy);
    }

    public async Task<SecurityPolicyDetailDto> CreateAsync(
        SecurityPolicyCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await PolicyKeyExistsAsync(dto.PolicyKey, null, cancellationToken))
        {
            throw new InvalidOperationException($"Security policy with key '{dto.PolicyKey}' already exists");
        }

        var securityPolicy = _mapper.Map<SecurityPolicy>(dto);
        securityPolicy.CreatedById = userId;
        securityPolicy.UpdatedById = userId;

        _context.SecurityPolicies.Add(securityPolicy);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("SecurityPolicyService", $"Security policy created: {securityPolicy.PolicyKey} by user {userId}");

        return _mapper.Map<SecurityPolicyDetailDto>(securityPolicy);
    }

    public async Task<SecurityPolicyDetailDto> UpdateAsync(
        Guid id,
        SecurityPolicyUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var securityPolicy = await _context.SecurityPolicies.FindAsync(new object[] { id }, cancellationToken);
        if (securityPolicy == null)
        {
            throw new InvalidOperationException("Security policy not found");
        }

        if (securityPolicy.PolicyKey != dto.PolicyKey && await PolicyKeyExistsAsync(dto.PolicyKey, id, cancellationToken))
        {
            throw new InvalidOperationException($"Security policy with key '{dto.PolicyKey}' already exists");
        }

        securityPolicy.PolicyKey = dto.PolicyKey;
        securityPolicy.PolicyName = dto.PolicyName;
        securityPolicy.Description = dto.Description;
        securityPolicy.Category = dto.Category;
        securityPolicy.PolicyValue = dto.PolicyValue;
        securityPolicy.ValueType = dto.ValueType;
        securityPolicy.IsEnforced = dto.IsEnforced;
        securityPolicy.IsSystemPolicy = dto.IsSystemPolicy;
        securityPolicy.SeverityLevel = dto.SeverityLevel;
        securityPolicy.LastReviewedAt = dto.LastReviewedAt;
        securityPolicy.SortOrder = dto.SortOrder;
        securityPolicy.IsActive = dto.IsActive;
        securityPolicy.UpdatedById = userId;
        securityPolicy.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("SecurityPolicyService", $"Security policy updated: {securityPolicy.PolicyKey} by user {userId}");

        return _mapper.Map<SecurityPolicyDetailDto>(securityPolicy);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var securityPolicy = await _context.SecurityPolicies
            .FirstOrDefaultAsync(sp => sp.Id == id, cancellationToken);

        if (securityPolicy == null)
        {
            throw new InvalidOperationException("Security policy not found");
        }

        if (securityPolicy.IsSystemPolicy)
        {
            throw new InvalidOperationException("Cannot delete system policies");
        }

        securityPolicy.IsActive = false;
        securityPolicy.UpdatedById = userId;
        securityPolicy.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("SecurityPolicyService", $"Security policy soft-deleted: {securityPolicy.PolicyKey} by user {userId}");
    }

    public async Task<bool> PolicyKeyExistsAsync(
        string policyKey,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SecurityPolicies.Where(sp => sp.PolicyKey == policyKey);

        if (excludeId.HasValue)
        {
            query = query.Where(sp => sp.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
