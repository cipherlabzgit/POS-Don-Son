using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.DailyProductions;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DailyProductionService : IDailyProductionService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public DailyProductionService(
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

    public async Task<(List<DailyProductionListDto> Productions, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status,
        Guid requestingUserId, bool viewAllRecords, bool showPreviousRecords,
        CancellationToken cancellationToken = default)
    {
        var query = _context.DailyProductions
            .Include(d => d.Product)
            .Include(d => d.Shift)
            .Include(d => d.ProductionSection)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .Include(d => d.ApprovedBy)
            .Where(d => d.IsActive)
            .AsQueryable();

        var (startOfSlTodayUtc, endOfSlTodayUtc) = SriLankaDisplayTime.GetCurrentSriLankaDayUtcWindow();

        if (viewAllRecords)
        {
            // Admin / elevated: all users. Default = rows added today (Sri Lanka calendar); optional full history.
            if (!showPreviousRecords)
            {
                query = query.Where(d =>
                    d.CreatedAt >= startOfSlTodayUtc &&
                    d.CreatedAt < endOfSlTodayUtc);
            }
        }
        else
        {
            // Standard users: own rows only, always limited to added today (Sri Lanka). No "previous records" access.
            query = query.Where(d => d.CreatedById == requestingUserId);
            query = query.Where(d =>
                d.CreatedAt >= startOfSlTodayUtc &&
                d.CreatedAt < endOfSlTodayUtc);
        }

        if (fromDate.HasValue)
            query = query.Where(d => d.ProductionDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(d => d.ProductionDate <= toDate.Value);

        if (productId.HasValue)
            query = query.Where(d => d.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DailyProductionStatus>(status, true, out var statusEnum))
            query = query.Where(d => d.Status == statusEnum);

        // Get all matching records (not paginated yet - we'll paginate after grouping)
        var allProductions = await query
            .OrderByDescending(d => d.ProductionDate)
            .ThenByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        // Group by ProductionNo (all items with same ProductionNo should be in one batch)
        var groupedProductions = allProductions
            .GroupBy(d => d.ProductionNo)
            .Select(group =>
            {
                var firstItem = group.OrderBy(d => d.CreatedAt).First();
                
                return new DailyProductionListDto
                {
                    Id = firstItem.Id,
                    ProductionNo = firstItem.ProductionNo,
                    ProductionDate = firstItem.ProductionDate,
                    ShiftId = firstItem.ShiftId,
                    ShiftName = firstItem.Shift?.Name ?? string.Empty,
                    Status = firstItem.Status.ToString(),
                    BatchId = firstItem.BatchId,
                    TotalItems = group.Count(),
                    TotalProducedQty = group.Sum(d => d.ProducedQty),
                    Lines = group.Select(d => new DailyProductionLineItemDto
                    {
                        Id = d.Id,
                        ProductId = d.ProductId,
                        ProductCode = d.Product?.Code ?? string.Empty,
                        ProductName = d.Product?.Name ?? string.Empty,
                        ProductionSectionId = d.ProductionSectionId,
                        ProductionSectionName = d.ProductionSection?.Name ?? string.Empty,
                        PlannedQty = d.PlannedQty,
                        ProducedQty = d.ProducedQty,
                        Notes = d.Notes
                    }).ToList(),
                    UpdatedAt = firstItem.UpdatedAt,
                    CreatedByName = firstItem.CreatedBy?.FullName,
                    UpdatedByName = firstItem.UpdatedBy?.FullName,
                    ApprovedByName = firstItem.ApprovedBy?.FullName,
                    ApprovedDate = firstItem.ApprovedDate
                };
            })
            .OrderByDescending(d => d.ProductionDate)
            .ThenByDescending(d => d.UpdatedAt)
            .ToList();

        // Now paginate the grouped results
        var totalCount = groupedProductions.Count;
        var pagedProductions = groupedProductions
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (pagedProductions, totalCount);
    }

    public async Task<DailyProductionDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .Include(d => d.Product)
            .Include(d => d.Shift)
            .Include(d => d.ProductionSection)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .Include(d => d.ApprovedBy)
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        return _mapper.Map<DailyProductionDetailDto>(production);
    }

    public async Task<DailyProductionDetailDto?> GetByProductionNoAsync(string productionNo, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .Include(d => d.Product)
            .Include(d => d.Shift)
            .Include(d => d.ProductionSection)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .Include(d => d.ApprovedBy)
            .FirstOrDefaultAsync(d => d.ProductionNo == productionNo && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        return _mapper.Map<DailyProductionDetailDto>(production);
    }

    public async Task<List<string>> GetDistinctProductionNumbersAsync(CancellationToken cancellationToken = default)
    {
        return await _context.DailyProductions
            .Where(d => d.IsActive && d.Status == DailyProductionStatus.Approved)
            .Select(d => d.ProductionNo)
            .Distinct()
            .OrderByDescending(pn => pn)
            .Take(100)
            .ToListAsync(cancellationToken);
    }

    public async Task<DailyProductionDetailDto> CreateAsync(CreateDailyProductionDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        // Verify shift exists
        var shiftExists = await _context.Shifts.AnyAsync(s => s.Id == dto.ShiftId && s.IsActive, cancellationToken);
        if (!shiftExists)
            throw new InvalidOperationException($"Invalid shift ID: {dto.ShiftId}");

        var sectionExists = await _context.ProductionSections.AnyAsync(s => s.Id == dto.ProductionSectionId && s.IsActive, cancellationToken);
        if (!sectionExists)
            throw new InvalidOperationException($"Invalid production section ID: {dto.ProductionSectionId}");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("production:daily", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("production:daily:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;
        
        // Debug logging
        Console.WriteLine($"[AUTO-APPROVAL DEBUG] production:daily");
        Console.WriteLine($"  - Config Enabled: {autoApprovalEnabled}");
        Console.WriteLine($"  - Has Wildcard (*): {permissionCodes.Contains("*")}");
        Console.WriteLine($"  - Has Specific Permission: {permissionCodes.Contains("production:daily:auto-approve")}");
        Console.WriteLine($"  - Can Auto-Approve: {canAutoApprove}");
        Console.WriteLine($"  - Total Permissions: {permissionCodes.Count}");
        Console.WriteLine($"  - Should Auto-Approve: {shouldAutoApprove}");
        if (permissionCodes.Count > 0)
        {
            Console.WriteLine($"  - User Permissions: {string.Join(", ", permissionCodes.Take(10))}");
        }

        var production = new DailyProduction
        {
            Id = Guid.NewGuid(),
            ProductionDate = DateTime.SpecifyKind(dto.ProductionDate, DateTimeKind.Utc),
            ProductId = dto.ProductId,
            ProductionSectionId = dto.ProductionSectionId,
            PlannedQty = dto.PlannedQty,
            ProducedQty = dto.ProducedQty,
            ShiftId = dto.ShiftId,
            Status = shouldAutoApprove ? DailyProductionStatus.Approved : DailyProductionStatus.Pending,
            Notes = dto.Notes,
            BatchId = dto.BatchId,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            production.ApprovedById = userId;
            production.ApprovedDate = DateTime.UtcNow;
        }

        _context.DailyProductions.Add(production);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProduction",
            DocumentId = production.Id,
            DocumentNo = production.ProductionNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, adjust stock immediately
        if (shouldAutoApprove)
        {
            await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
            {
                ProductId = production.ProductId,
                ProductionSectionId = production.ProductionSectionId,
                Quantity = production.ProducedQty,
                TransactionType = "Production",
                Reason = "Production auto-approved",
                ReferenceNo = production.ProductionNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(production.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created production");
    }

    public async Task<DailyProductionDetailDto?> UpdateAsync(Guid id, UpdateDailyProductionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        if (production.Status != DailyProductionStatus.Pending)
            throw new InvalidOperationException("Only pending productions can be updated");

        // Verify shift exists
        var shiftExists = await _context.Shifts.AnyAsync(s => s.Id == dto.ShiftId && s.IsActive, cancellationToken);
        if (!shiftExists)
            throw new InvalidOperationException($"Invalid shift ID: {dto.ShiftId}");

        var sectionExists = await _context.ProductionSections.AnyAsync(s => s.Id == dto.ProductionSectionId && s.IsActive, cancellationToken);
        if (!sectionExists)
            throw new InvalidOperationException($"Invalid production section ID: {dto.ProductionSectionId}");

        production.ProductionDate = DateTime.SpecifyKind(dto.ProductionDate, DateTimeKind.Utc);
        production.ProductId = dto.ProductId;
        production.ProductionSectionId = dto.ProductionSectionId;
        production.PlannedQty = dto.PlannedQty;
        production.ProducedQty = dto.ProducedQty;
        production.ShiftId = dto.ShiftId;
        production.Notes = dto.Notes;
        production.UpdatedById = userId;
        production.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return false;

        if (production.Status != DailyProductionStatus.Pending)
            throw new InvalidOperationException("Only pending productions can be deleted");

        production.IsActive = false;
        production.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<DailyProductionDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        if (production.Status != DailyProductionStatus.Draft)
            throw new InvalidOperationException("Only draft productions can be submitted for approval");

        production.Status = DailyProductionStatus.Pending;
        production.UpdatedById = userId;
        production.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProduction",
            DocumentId = production.Id,
            DocumentNo = production.ProductionNo,
            FromStatus = "Draft",
            ToStatus = "Pending",
            Action = "Submitted",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DailyProductionDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        if (production.Status == DailyProductionStatus.Approved)
            throw new InvalidOperationException("This production record has already been approved.");

        if (production.Status != DailyProductionStatus.Pending)
            throw new InvalidOperationException("Only pending productions can be approved");

        production.Status = DailyProductionStatus.Approved;
        production.ApprovedById = userId;
        production.ApprovedDate = DateTime.UtcNow;
        production.UpdatedById = userId;
        production.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProduction",
            DocumentId = production.Id,
            DocumentNo = production.ProductionNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Add produced quantity to freezer stock for the production section
        await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
        {
            ProductId = production.ProductId,
            ProductionSectionId = production.ProductionSectionId,
            Quantity = production.ProducedQty,
            TransactionType = "Production",
            Reason = "Production approved",
            ReferenceNo = production.ProductionNo
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DailyProductionDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var production = await _context.DailyProductions
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive, cancellationToken);

        if (production == null)
            return null;

        if (production.Status != DailyProductionStatus.Pending)
            throw new InvalidOperationException("Only pending productions can be rejected");

        production.Status = DailyProductionStatus.Rejected;
        production.UpdatedById = userId;
        production.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DailyProduction",
            DocumentId = production.Id,
            DocumentNo = production.ProductionNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
