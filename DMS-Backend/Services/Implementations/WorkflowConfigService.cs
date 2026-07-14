using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.WorkflowConfigs;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class WorkflowConfigService : IWorkflowConfigService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public WorkflowConfigService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<WorkflowConfigListDto> workflowConfigs, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkflowConfigs.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(wc => wc.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(wc =>
                wc.Code.Contains(searchTerm) ||
                wc.Name.Contains(searchTerm) ||
                wc.EntityType.Contains(searchTerm) ||
                (wc.Description != null && wc.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var workflowConfigs = await query
            .OrderBy(wc => wc.EntityType)
            .ThenBy(wc => wc.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var workflowConfigDtos = _mapper.Map<List<WorkflowConfigListDto>>(workflowConfigs);

        return (workflowConfigDtos, totalCount);
    }

    public async Task<WorkflowConfigDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var workflowConfig = await _context.WorkflowConfigs
            .FirstOrDefaultAsync(wc => wc.Id == id, cancellationToken);

        if (workflowConfig == null)
        {
            return null;
        }

        return _mapper.Map<WorkflowConfigDetailDto>(workflowConfig);
    }

    public async Task<WorkflowConfigDetailDto> CreateAsync(
        WorkflowConfigCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Workflow config with code '{dto.Code}' already exists");
        }

        var workflowConfig = _mapper.Map<WorkflowConfig>(dto);
        workflowConfig.CreatedById = userId;
        workflowConfig.UpdatedById = userId;

        _context.WorkflowConfigs.Add(workflowConfig);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("WorkflowConfigService", $"Workflow config created: {workflowConfig.Code} by user {userId}");

        return _mapper.Map<WorkflowConfigDetailDto>(workflowConfig);
    }

    public async Task<WorkflowConfigDetailDto> UpdateAsync(
        Guid id,
        WorkflowConfigUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var workflowConfig = await _context.WorkflowConfigs.FindAsync(new object[] { id }, cancellationToken);
        if (workflowConfig == null)
        {
            throw new InvalidOperationException("Workflow config not found");
        }

        if (workflowConfig.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Workflow config with code '{dto.Code}' already exists");
        }

        workflowConfig.Code = dto.Code;
        workflowConfig.Name = dto.Name;
        workflowConfig.Description = dto.Description;
        workflowConfig.EntityType = dto.EntityType;
        workflowConfig.WorkflowType = dto.WorkflowType;
        workflowConfig.RequiresApproval = dto.RequiresApproval;
        workflowConfig.ApprovalLevels = dto.ApprovalLevels;
        workflowConfig.AutoApproveThreshold = dto.AutoApproveThreshold;
        workflowConfig.ApprovalSteps = dto.ApprovalSteps;
        workflowConfig.NotificationSettings = dto.NotificationSettings;
        workflowConfig.TimeoutHours = dto.TimeoutHours;
        workflowConfig.EscalationConfig = dto.EscalationConfig;
        workflowConfig.IsEnabled = dto.IsEnabled;
        workflowConfig.IsActive = dto.IsActive;
        workflowConfig.UpdatedById = userId;
        workflowConfig.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("WorkflowConfigService", $"Workflow config updated: {workflowConfig.Code} by user {userId}");

        return _mapper.Map<WorkflowConfigDetailDto>(workflowConfig);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var workflowConfig = await _context.WorkflowConfigs
            .FirstOrDefaultAsync(wc => wc.Id == id, cancellationToken);

        if (workflowConfig == null)
        {
            throw new InvalidOperationException("Workflow config not found");
        }

        workflowConfig.IsActive = false;
        workflowConfig.UpdatedById = userId;
        workflowConfig.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("WorkflowConfigService", $"Workflow config soft-deleted: {workflowConfig.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkflowConfigs.Where(wc => wc.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(wc => wc.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<bool> IsApprovalRequiredAsync(string workflowCode, CancellationToken cancellationToken = default)
    {
        var config = await _context.WorkflowConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(wc => wc.Code == workflowCode && wc.IsActive, cancellationToken);

        // If no config found or workflow is disabled, bypass approval
        if (config == null || !config.IsEnabled)
            return false;

        return config.RequiresApproval;
    }
}
