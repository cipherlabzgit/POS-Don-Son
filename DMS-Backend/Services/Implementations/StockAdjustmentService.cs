using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.StockAdjustments;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class StockAdjustmentService : IStockAdjustmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public StockAdjustmentService(
        ApplicationDbContext context,
        IMapper mapper,
        IFreezerStockService freezerStockService,
        IOperationApprovalRecorder approvalRecorder,
        IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _freezerStockService = freezerStockService;
        _approvalRecorder = approvalRecorder;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<(List<StockAdjustmentListDto> Adjustments, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.StockAdjustments
            .Include(s => s.Product)
            .Include(s => s.ProductionSection)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .Include(s => s.ApprovedBy)
            .Where(s => s.IsActive)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(s => s.AdjustmentDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(s => s.AdjustmentDate <= toDate.Value);

        if (productId.HasValue)
            query = query.Where(s => s.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<StockAdjustmentStatus>(status, true, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var adjustments = await query
            .OrderByDescending(s => s.AdjustmentDate)
            .ThenByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<StockAdjustmentListDto>>(adjustments), totalCount);
    }

    public async Task<StockAdjustmentDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .Include(s => s.Product)
            .Include(s => s.ProductionSection)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .Include(s => s.ApprovedBy)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (adjustment == null)
            return null;

        return _mapper.Map<StockAdjustmentDetailDto>(adjustment);
    }

    public async Task<StockAdjustmentDetailDto?> GetByAdjustmentNoAsync(string adjustmentNo, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .Include(s => s.Product)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .Include(s => s.ApprovedBy)
            .FirstOrDefaultAsync(s => s.AdjustmentNo == adjustmentNo && s.IsActive, cancellationToken);

        if (adjustment == null)
            return null;

        return _mapper.Map<StockAdjustmentDetailDto>(adjustment);
    }

    public async Task<StockAdjustmentDetailDto> CreateAsync(CreateStockAdjustmentDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<StockAdjustmentType>(dto.AdjustmentType, true, out var adjustmentType))
            throw new InvalidOperationException($"Invalid adjustment type: {dto.AdjustmentType}");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("production:stock-adjustment", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("production:stock-adjustment:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var adjustment = new StockAdjustment
        {
            Id = Guid.NewGuid(),
            AdjustmentDate = DateTime.SpecifyKind(dto.AdjustmentDate, DateTimeKind.Utc),
            ProductId = dto.ProductId,
            ProductionSectionId = dto.ProductionSectionId,
            AdjustmentType = adjustmentType,
            Quantity = dto.Quantity,
            Reason = dto.Reason,
            Status = shouldAutoApprove ? StockAdjustmentStatus.Approved : StockAdjustmentStatus.Pending,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            adjustment.ApprovedById = userId;
            adjustment.ApprovedDate = DateTime.UtcNow;
        }

        _context.StockAdjustments.Add(adjustment);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "StockAdjustment",
            DocumentId = adjustment.Id,
            DocumentNo = adjustment.AdjustmentNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, adjust stock immediately
        if (shouldAutoApprove)
        {
            var quantityDelta = adjustment.AdjustmentType == StockAdjustmentType.Increase
                ? adjustment.Quantity
                : -adjustment.Quantity;

            await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
            {
                ProductId = adjustment.ProductId,
                ProductionSectionId = adjustment.ProductionSectionId,
                Quantity = quantityDelta,
                TransactionType = "StockAdjustment",
                Reason = $"{adjustment.Reason} - Auto-approved",
                ReferenceNo = adjustment.AdjustmentNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(adjustment.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created adjustment");
    }

    public async Task<StockAdjustmentDetailDto?> UpdateAsync(Guid id, UpdateStockAdjustmentDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (adjustment == null)
            return null;

        if (adjustment.Status != StockAdjustmentStatus.Pending)
            throw new InvalidOperationException("Only pending adjustments can be updated");

        if (!Enum.TryParse<StockAdjustmentType>(dto.AdjustmentType, true, out var adjustmentType))
            throw new InvalidOperationException($"Invalid adjustment type: {dto.AdjustmentType}");

        adjustment.AdjustmentDate = DateTime.SpecifyKind(dto.AdjustmentDate, DateTimeKind.Utc);
        adjustment.ProductId = dto.ProductId;
        adjustment.ProductionSectionId = dto.ProductionSectionId;
        adjustment.AdjustmentType = adjustmentType;
        adjustment.Quantity = dto.Quantity;
        adjustment.Reason = dto.Reason;
        adjustment.Notes = dto.Notes;
        adjustment.UpdatedById = userId;
        adjustment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (adjustment == null)
            return false;

        if (adjustment.Status != StockAdjustmentStatus.Pending)
            throw new InvalidOperationException("Only pending adjustments can be deleted");

        adjustment.IsActive = false;
        adjustment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<StockAdjustmentDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<StockAdjustmentDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (adjustment == null)
            return null;

        if (adjustment.Status == StockAdjustmentStatus.Approved)
            throw new InvalidOperationException("This stock adjustment has already been approved.");

        if (adjustment.Status != StockAdjustmentStatus.Pending)
            throw new InvalidOperationException("Only pending adjustments can be approved");

        adjustment.Status = StockAdjustmentStatus.Approved;
        adjustment.ApprovedById = userId;
        adjustment.ApprovedDate = DateTime.UtcNow;
        adjustment.UpdatedById = userId;
        adjustment.UpdatedAt = DateTime.UtcNow;

        // Update ApprovalQueue status
        var approvalQueue = await _context.ApprovalQueues
            .FirstOrDefaultAsync(a => a.EntityId == id && a.ApprovalType == "StockAdjustment" && a.IsActive, cancellationToken);

        if (approvalQueue != null)
        {
            approvalQueue.Status = "Approved";
            approvalQueue.ApprovedById = userId;
            approvalQueue.ApprovedAt = DateTime.UtcNow;
            approvalQueue.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "StockAdjustment",
            DocumentId = adjustment.Id,
            DocumentNo = adjustment.AdjustmentNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Apply the adjustment to freezer stock: Increase = +qty, Decrease = -qty
        var quantityDelta = adjustment.AdjustmentType == StockAdjustmentType.Increase
            ? adjustment.Quantity
            : -adjustment.Quantity;

        await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
        {
            ProductId = adjustment.ProductId,
            ProductionSectionId = adjustment.ProductionSectionId,
            Quantity = quantityDelta,
            TransactionType = "StockAdjustment",
            Reason = adjustment.Reason,
            ReferenceNo = adjustment.AdjustmentNo
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<StockAdjustmentDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var adjustment = await _context.StockAdjustments
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (adjustment == null)
            return null;

        if (adjustment.Status != StockAdjustmentStatus.Pending)
            throw new InvalidOperationException("Only pending adjustments can be rejected");

        adjustment.Status = StockAdjustmentStatus.Rejected;
        adjustment.UpdatedById = userId;
        adjustment.UpdatedAt = DateTime.UtcNow;

        // Update ApprovalQueue status
        var approvalQueue = await _context.ApprovalQueues
            .FirstOrDefaultAsync(a => a.EntityId == id && a.ApprovalType == "StockAdjustment" && a.IsActive, cancellationToken);

        if (approvalQueue != null)
        {
            approvalQueue.Status = "Rejected";
            approvalQueue.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "StockAdjustment",
            DocumentId = adjustment.Id,
            DocumentNo = adjustment.AdjustmentNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
