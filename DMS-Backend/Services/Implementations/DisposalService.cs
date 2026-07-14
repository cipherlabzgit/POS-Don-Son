using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Disposals;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DisposalService : IDisposalService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public DisposalService(
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

    public async Task<(List<DisposalListDto> Disposals, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.Disposals
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(d => d.DisposalDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(d => d.DisposalDate <= toDate.Value);

        if (outletId.HasValue)
            query = query.Where(d => d.OutletId == outletId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DisposalStatus>(status, true, out var statusEnum))
            query = query.Where(d => d.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var disposals = await query
            .OrderByDescending(d => d.DisposalDate)
            .ThenByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<DisposalListDto>>(disposals), totalCount);
    }

    public async Task<DisposalDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (disposal == null)
            return null;

        return _mapper.Map<DisposalDetailDto>(disposal);
    }

    public async Task<DisposalDetailDto?> GetByDisposalNoAsync(string disposalNo, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.DisposalNo == disposalNo, cancellationToken);

        if (disposal == null)
            return null;

        return _mapper.Map<DisposalDetailDto>(disposal);
    }

    public async Task<DisposalDetailDto> CreateAsync(CreateDisposalDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:disposal", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:disposal:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var disposalDateUtc = DateTime.SpecifyKind(dto.DisposalDate, DateTimeKind.Utc);
        var disposal = new Disposal
        {
            Id = Guid.NewGuid(),
            DisposalDate = disposalDateUtc,
            OutletId = dto.OutletId,
            DeliveredDate = disposalDateUtc,
            Status = shouldAutoApprove ? DisposalStatus.Approved : DisposalStatus.Pending,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            disposal.ApprovedById = userId;
            disposal.ApprovedDate = DateTime.UtcNow;
        }

        foreach (var itemDto in dto.Items)
        {
            var item = new DisposalItem
            {
                Id = Guid.NewGuid(),
                DisposalId = disposal.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                Reason = itemDto.Reason,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            disposal.Items.Add(item);
        }

        disposal.TotalItems = disposal.Items.Count;

        _context.Disposals.Add(disposal);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Disposal",
            DocumentId = disposal.Id,
            DocumentNo = disposal.DisposalNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, deduct disposed quantities from freezer stock
        if (shouldAutoApprove)
        {
            var disposalWithItems = await _context.Disposals
                .Include(d => d.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(d => d.Id == disposal.Id, cancellationToken);

            if (disposalWithItems != null)
            {
                foreach (var item in disposalWithItems.Items)
                {
                    if (item.Product == null) continue;
                    var productionSection = await _context.ProductionSections
                        .FirstOrDefaultAsync(ps => ps.IsActive &&
                            item.Product.ProductionSection != null &&
                            ps.Name == item.Product.ProductionSection,
                            cancellationToken);

                    if (productionSection == null) continue;

                    await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
                    {
                        ProductId = item.ProductId,
                        ProductionSectionId = productionSection.Id,
                        Quantity = -item.Quantity,
                        TransactionType = "Disposal",
                        Reason = item.Reason ?? $"Disposal at outlet {disposalWithItems.OutletId} - Auto-approved",
                        ReferenceNo = disposalWithItems.DisposalNo
                    }, userId, cancellationToken);
                }
            }
        }

        return await GetByIdAsync(disposal.Id, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created disposal");
    }

    public async Task<DisposalDetailDto?> UpdateAsync(Guid id, UpdateDisposalDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (disposal == null)
            return null;

        if (disposal.Status != DisposalStatus.Pending)
            throw new InvalidOperationException("Only pending disposals can be updated");

        var disposalDateUtc = DateTime.SpecifyKind(dto.DisposalDate, DateTimeKind.Utc);
        disposal.DisposalDate = disposalDateUtc;
        disposal.OutletId = dto.OutletId;
        disposal.DeliveredDate = disposalDateUtc;
        disposal.Notes = dto.Notes;
        disposal.UpdatedById = userId;
        disposal.UpdatedAt = DateTime.UtcNow;

        _context.DisposalItems.RemoveRange(disposal.Items);

        foreach (var itemDto in dto.Items)
        {
            var item = new DisposalItem
            {
                Id = itemDto.Id ?? Guid.NewGuid(),
                DisposalId = disposal.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                Reason = itemDto.Reason,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            disposal.Items.Add(item);
        }

        disposal.TotalItems = disposal.Items.Count;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (disposal == null)
            return false;

        if (disposal.Status != DisposalStatus.Pending)
            throw new InvalidOperationException("Only pending disposals can be deleted");

        disposal.IsActive = false;
        disposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<DisposalDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<DisposalDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (disposal == null)
            return null;

        if (disposal.Status == DisposalStatus.Approved)
            throw new InvalidOperationException("This disposal has already been approved.");

        if (disposal.Status != DisposalStatus.Pending)
            throw new InvalidOperationException("Only pending disposals can be approved");

        disposal.Status = DisposalStatus.Approved;
        disposal.ApprovedById = userId;
        disposal.ApprovedDate = DateTime.UtcNow;
        disposal.UpdatedById = userId;
        disposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Disposal",
            DocumentId = disposal.Id,
            DocumentNo = disposal.DisposalNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Deduct disposed quantities from freezer stock
        foreach (var item in disposal.Items)
        {
            if (item.Product == null) continue;
            var productionSection = await _context.ProductionSections
                .FirstOrDefaultAsync(ps => ps.IsActive &&
                    item.Product.ProductionSection != null &&
                    ps.Name == item.Product.ProductionSection,
                    cancellationToken);

            if (productionSection == null) continue;

            await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
            {
                ProductId = item.ProductId,
                ProductionSectionId = productionSection.Id,
                Quantity = -item.Quantity,
                TransactionType = "Disposal",
                Reason = item.Reason ?? $"Disposal at outlet {disposal.OutletId}",
                ReferenceNo = disposal.DisposalNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DisposalDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var disposal = await _context.Disposals
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (disposal == null)
            return null;

        if (disposal.Status != DisposalStatus.Pending)
            throw new InvalidOperationException("Only pending disposals can be rejected");

        disposal.Status = DisposalStatus.Rejected;
        disposal.UpdatedById = userId;
        disposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Disposal",
            DocumentId = disposal.Id,
            DocumentNo = disposal.DisposalNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
