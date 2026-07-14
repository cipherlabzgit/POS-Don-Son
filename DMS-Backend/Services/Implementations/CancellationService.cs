using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Cancellations;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class CancellationService : ICancellationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public CancellationService(
        ApplicationDbContext context,
        IMapper mapper,
        IOperationApprovalRecorder approvalRecorder,
        IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _approvalRecorder = approvalRecorder;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<(List<CancellationListDto> Cancellations, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.Cancellations
            .Include(c => c.Outlet)
            .Include(c => c.UpdatedBy)
            .Include(c => c.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(c => c.CancellationDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(c => c.CancellationDate <= toDate.Value);

        if (outletId.HasValue)
            query = query.Where(c => c.OutletId == outletId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CancellationStatus>(status, true, out var statusEnum))
            query = query.Where(c => c.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var cancellations = await query
            .OrderByDescending(c => c.CancellationDate)
            .ThenByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<CancellationListDto>>(cancellations), totalCount);
    }

    public async Task<CancellationDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .Include(c => c.Outlet)
            .Include(c => c.ApprovedBy)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cancellation == null)
            return null;

        return _mapper.Map<CancellationDetailDto>(cancellation);
    }

    public async Task<CancellationDetailDto?> GetByCancellationNoAsync(string cancellationNo, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .Include(c => c.Outlet)
            .Include(c => c.ApprovedBy)
            .FirstOrDefaultAsync(c => c.CancellationNo == cancellationNo, cancellationToken);

        if (cancellation == null)
            return null;

        return _mapper.Map<CancellationDetailDto>(cancellation);
    }

    public async Task<CancellationDetailDto> CreateAsync(CreateCancellationDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:cancellation", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:cancellation:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var cancellation = new Cancellation
        {
            Id = Guid.NewGuid(),
            CancellationDate = DateTime.SpecifyKind(dto.CancellationDate, DateTimeKind.Utc),
            DeliveryNo = dto.DeliveryNo,
            DeliveredDate = DateTime.SpecifyKind(dto.DeliveredDate, DateTimeKind.Utc),
            OutletId = dto.OutletId,
            Reason = dto.Reason,
            Status = shouldAutoApprove ? CancellationStatus.Approved : CancellationStatus.Pending,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            cancellation.ApprovedById = userId;
            cancellation.ApprovedDate = DateTime.UtcNow;
        }

        _context.Cancellations.Add(cancellation);
        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancellationNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        return await GetByIdAsync(cancellation.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created cancellation");
    }

    public async Task<CancellationDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<CancellationDetailDto?> UpdateAsync(Guid id, UpdateCancellationDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != CancellationStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be updated");

        cancellation.CancellationDate = DateTime.SpecifyKind(dto.CancellationDate, DateTimeKind.Utc);
        cancellation.DeliveryNo = dto.DeliveryNo;
        cancellation.DeliveredDate = DateTime.SpecifyKind(dto.DeliveredDate, DateTimeKind.Utc);
        cancellation.OutletId = dto.OutletId;
        cancellation.Reason = dto.Reason;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cancellation == null)
            return false;

        if (cancellation.Status != CancellationStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be deleted");

        cancellation.IsActive = false;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<CancellationDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != CancellationStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be approved");

        cancellation.Status = CancellationStatus.Approved;
        cancellation.ApprovedById = userId;
        cancellation.ApprovedDate = DateTime.UtcNow;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancellationNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<CancellationDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.Cancellations
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != CancellationStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be rejected");

        cancellation.Status = CancellationStatus.Rejected;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancellationNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
