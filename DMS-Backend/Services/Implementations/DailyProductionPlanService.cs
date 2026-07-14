using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.DailyProductionPlans;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DailyProductionPlanService : IDailyProductionPlanService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public DailyProductionPlanService(ApplicationDbContext context, IMapper mapper, IOperationApprovalRecorder approvalRecorder, IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _approvalRecorder = approvalRecorder;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<(List<DailyProductionPlanListDto> Plans, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status, string? priority, CancellationToken cancellationToken = default)
    {
        var query = _context.DailyProductionPlans
            .Include(p => p.Product)
            .Include(p => p.CreatedBy)
            .Include(p => p.UpdatedBy)
            .Include(p => p.ApprovedBy)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(p => p.PlanDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(p => p.PlanDate <= toDate.Value);

        if (productId.HasValue)
            query = query.Where(p => p.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DailyProductionPlanStatus>(status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<ProductionPriority>(priority, true, out var priorityEnum))
            query = query.Where(p => p.Priority == priorityEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var plans = await query
            .OrderByDescending(p => p.PlanDate)
            .ThenByDescending(p => p.Priority)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<DailyProductionPlanListDto>>(plans), totalCount);
    }

    public async Task<DailyProductionPlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .Include(p => p.Product)
            .Include(p => p.CreatedBy)
            .Include(p => p.UpdatedBy)
            .Include(p => p.ApprovedBy)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        return _mapper.Map<DailyProductionPlanDetailDto>(plan);
    }

    public async Task<DailyProductionPlanDetailDto?> GetByPlanNoAsync(string planNo, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .Include(p => p.Product)
            .Include(p => p.CreatedBy)
            .Include(p => p.UpdatedBy)
            .Include(p => p.ApprovedBy)
            .FirstOrDefaultAsync(p => p.PlanNo == planNo && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        return _mapper.Map<DailyProductionPlanDetailDto>(plan);
    }

    public async Task<DailyProductionPlanDetailDto> CreateAsync(CreateDailyProductionPlanDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<ProductionPriority>(dto.Priority, true, out var priority))
            throw new InvalidOperationException($"Invalid priority: {dto.Priority}");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("production:daily-plan", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("production:daily-plan:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var plan = new DailyProductionPlan
        {
            Id = Guid.NewGuid(),
            PlanDate = DateTime.SpecifyKind(dto.PlanDate, DateTimeKind.Utc),
            ProductId = dto.ProductId,
            PlannedQty = dto.PlannedQty,
            Priority = priority,
            Status = shouldAutoApprove ? DailyProductionPlanStatus.Approved : DailyProductionPlanStatus.Pending,
            Reference = dto.Reference,
            Comment = dto.Comment,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            plan.ApprovedById = userId;
            plan.ApprovedDate = DateTime.UtcNow;
        }

        _context.DailyProductionPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProductionPlan",
            DocumentId = plan.Id,
            DocumentNo = plan.PlanNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        return await GetByIdAsync(plan.Id, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created plan");
    }

    public async Task<DailyProductionPlanDetailDto?> UpdateAsync(Guid id, UpdateDailyProductionPlanDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        if (plan.Status != DailyProductionPlanStatus.Pending)
            throw new InvalidOperationException("Only pending plans can be updated");

        if (!Enum.TryParse<ProductionPriority>(dto.Priority, true, out var priority))
            throw new InvalidOperationException($"Invalid priority: {dto.Priority}");

        plan.PlanDate = DateTime.SpecifyKind(dto.PlanDate, DateTimeKind.Utc);
        plan.ProductId = dto.ProductId;
        plan.PlannedQty = dto.PlannedQty;
        plan.Priority = priority;
        plan.Reference = dto.Reference;
        plan.Comment = dto.Comment;
        plan.Notes = dto.Notes;
        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return false;

        if (plan.Status != DailyProductionPlanStatus.Pending)
            throw new InvalidOperationException("Only pending plans can be deleted");

        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<DailyProductionPlanDetailDto?> SubmitForApprovalAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<DailyProductionPlanDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        if (plan.Status != DailyProductionPlanStatus.PendingApproval)
            throw new InvalidOperationException("Only plans pending approval can be approved");

        plan.Status = DailyProductionPlanStatus.Approved;
        plan.ApprovedById = userId;
        plan.ApprovedDate = DateTime.UtcNow;
        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProductionPlan",
            DocumentId   = plan.Id,
            DocumentNo   = plan.PlanNo,
            FromStatus   = "PendingApproval",
            ToStatus     = "Approved",
            Action       = "Approved",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DailyProductionPlanDetailDto?> StartAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        if (plan.Status != DailyProductionPlanStatus.Approved)
            throw new InvalidOperationException("Only approved plans can be started");

        plan.Status = DailyProductionPlanStatus.InProgress;
        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProductionPlan",
            DocumentId   = plan.Id,
            DocumentNo   = plan.PlanNo,
            FromStatus   = "Approved",
            ToStatus     = "InProgress",
            Action       = "Started",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DailyProductionPlanDetailDto?> CompleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.DailyProductionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        if (plan.Status != DailyProductionPlanStatus.InProgress)
            throw new InvalidOperationException("Only in-progress plans can be completed");

        plan.Status = DailyProductionPlanStatus.Completed;
        plan.UpdatedById = userId;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProductionPlan",
            DocumentId   = plan.Id,
            DocumentNo   = plan.PlanNo,
            FromStatus   = "InProgress",
            ToStatus     = "Completed",
            Action       = "Completed",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
