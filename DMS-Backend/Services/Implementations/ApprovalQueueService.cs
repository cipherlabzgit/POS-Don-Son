using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.ApprovalQueue;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class ApprovalQueueService : IApprovalQueueService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ApprovalQueueService> _logger;

    public ApprovalQueueService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<ApprovalQueueService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<ApprovalQueueListDto> approvals, int totalCount)> GetPendingAsync(
        int page,
        int pageSize,
        string? approvalType = null,
        CancellationToken cancellationToken = default)
    {
        return await GetAllAsync(page, pageSize, approvalType, "Pending", cancellationToken);
    }

    public async Task<(IEnumerable<ApprovalQueueListDto> approvals, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? approvalType = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ApprovalQueues
            .Include(aq => aq.RequestedBy)
            .Include(aq => aq.ApprovedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(approvalType))
        {
            query = query.Where(aq => aq.ApprovalType == approvalType);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(aq => aq.Status == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var approvals = await query
            .OrderByDescending(aq => aq.Priority)
            .ThenByDescending(aq => aq.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<ApprovalQueueListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        await EnrichStockAdjustmentListRowsAsync(approvals, cancellationToken);

        return (approvals, totalCount);
    }

    private async Task EnrichStockAdjustmentListRowsAsync(
        List<ApprovalQueueListDto> approvals,
        CancellationToken cancellationToken)
    {
        var entityIds = approvals
            .Where(a => string.Equals(a.ApprovalType, "StockAdjustment", StringComparison.OrdinalIgnoreCase))
            .Select(a => a.EntityId)
            .Distinct()
            .ToList();

        if (entityIds.Count == 0)
        {
            return;
        }

        var adjustments = await _context.StockAdjustments
            .AsNoTracking()
            .Where(s => entityIds.Contains(s.Id) && s.IsActive)
            .Include(s => s.UpdatedBy)
            .Include(s => s.CreatedBy)
            .ToListAsync(cancellationToken);

        var byId = adjustments.ToDictionary(s => s.Id);

        foreach (var row in approvals)
        {
            if (!string.Equals(row.ApprovalType, "StockAdjustment", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!byId.TryGetValue(row.EntityId, out var sa))
            {
                continue;
            }

            row.AdjustmentDate = sa.AdjustmentDate;
            row.EntityUpdatedAt = sa.UpdatedAt;
            row.EntityUpdatedByName = sa.UpdatedBy?.FullName ?? sa.CreatedBy?.FullName;
        }
    }

    public async Task<ApprovalQueueDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var approval = await _context.ApprovalQueues
            .Include(aq => aq.RequestedBy)
            .Include(aq => aq.ApprovedBy)
            .FirstOrDefaultAsync(aq => aq.Id == id, cancellationToken);

        return approval == null ? null : _mapper.Map<ApprovalQueueDetailDto>(approval);
    }

    public async Task<ApprovalQueueDetailDto> CreateAsync(CreateApprovalQueueDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var approval = _mapper.Map<ApprovalQueue>(dto);
        approval.Id = Guid.NewGuid();
        approval.RequestedAt = DateTime.UtcNow;
        approval.Status = "Pending";
        approval.CreatedById = userId;
        approval.UpdatedById = userId;
        approval.CreatedAt = DateTime.UtcNow;
        approval.UpdatedAt = DateTime.UtcNow;

        _context.ApprovalQueues.Add(approval);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Approval request created: {Type} for entity {EntityId}", 
            approval.ApprovalType, approval.EntityId);

        return (await GetByIdAsync(approval.Id, cancellationToken))!;
    }

    public async Task<ApprovalQueueDetailDto> ApproveAsync(Guid id, Guid approvedByUserId, string? notes = null, CancellationToken cancellationToken = default)
    {
        var approval = await _context.ApprovalQueues.FirstOrDefaultAsync(aq => aq.Id == id, cancellationToken);
        if (approval == null)
        {
            throw new InvalidOperationException($"Approval with ID '{id}' not found.");
        }

        if (approval.Status != "Pending")
        {
            throw new InvalidOperationException($"Approval is already {approval.Status}.");
        }

        approval.Status = "Approved";
        approval.ApprovedById = approvedByUserId;
        approval.ApprovedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            approval.Notes = notes;
        }
        approval.UpdatedById = approvedByUserId;
        approval.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Approval approved: {Id} by user {UserId}", approval.Id, approvedByUserId);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<ApprovalQueueDetailDto> RejectAsync(Guid id, Guid rejectedByUserId, string rejectionReason, string? notes = null, CancellationToken cancellationToken = default)
    {
        var approval = await _context.ApprovalQueues.FirstOrDefaultAsync(aq => aq.Id == id, cancellationToken);
        if (approval == null)
        {
            throw new InvalidOperationException($"Approval with ID '{id}' not found.");
        }

        if (approval.Status != "Pending")
        {
            throw new InvalidOperationException($"Approval is already {approval.Status}.");
        }

        approval.Status = "Rejected";
        approval.ApprovedById = rejectedByUserId;
        approval.ApprovedAt = DateTime.UtcNow;
        approval.RejectionReason = rejectionReason;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            approval.Notes = notes;
        }
        approval.UpdatedById = rejectedByUserId;
        approval.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Approval rejected: {Id} by user {UserId}. Reason: {Reason}", 
            approval.Id, rejectedByUserId, rejectionReason);

        return (await GetByIdAsync(id, cancellationToken))!;
    }
}
