using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.DeliveryReturns;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DeliveryReturnService : IDeliveryReturnService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public DeliveryReturnService(
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

    public async Task<(List<DeliveryReturnListDto> DeliveryReturns, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.DeliveryReturns
            .Include(dr => dr.Outlet)
            .Include(dr => dr.CreatedBy)
            .Include(dr => dr.UpdatedBy)
            .Include(dr => dr.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(dr => dr.ReturnDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(dr => dr.ReturnDate <= toDate.Value);

        if (outletId.HasValue)
            query = query.Where(dr => dr.OutletId == outletId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DeliveryReturnStatus>(status, true, out var statusEnum))
            query = query.Where(dr => dr.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var deliveryReturns = await query
            .OrderByDescending(dr => dr.ReturnDate)
            .ThenByDescending(dr => dr.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<DeliveryReturnListDto>>(deliveryReturns), totalCount);
    }

    public async Task<DeliveryReturnDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .Include(dr => dr.Outlet)
            .Include(dr => dr.ApprovedBy)
            .Include(dr => dr.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(dr => dr.Id == id, cancellationToken);

        if (deliveryReturn == null)
            return null;

        return _mapper.Map<DeliveryReturnDetailDto>(deliveryReturn);
    }

    public async Task<DeliveryReturnDetailDto?> GetByReturnNoAsync(string returnNo, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .Include(dr => dr.Outlet)
            .Include(dr => dr.ApprovedBy)
            .Include(dr => dr.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(dr => dr.ReturnNo == returnNo, cancellationToken);

        if (deliveryReturn == null)
            return null;

        return _mapper.Map<DeliveryReturnDetailDto>(deliveryReturn);
    }

    public async Task<DeliveryReturnDetailDto> CreateAsync(CreateDeliveryReturnDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:delivery-return", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:delivery-return:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var deliveryReturn = new DeliveryReturn
        {
            Id = Guid.NewGuid(),
            ReturnDate = DateTime.SpecifyKind(dto.ReturnDate, DateTimeKind.Utc),
            DeliveryNo = dto.DeliveryNo,
            DeliveredDate = DateTime.SpecifyKind(dto.DeliveredDate, DateTimeKind.Utc),
            OutletId = dto.OutletId,
            Reason = dto.Reason,
            Status = shouldAutoApprove ? DeliveryReturnStatus.Approved : DeliveryReturnStatus.Pending,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            deliveryReturn.ApprovedById = userId;
            deliveryReturn.ApprovedDate = DateTime.UtcNow;
        }

        foreach (var itemDto in dto.Items)
        {
            var item = new DeliveryReturnItem
            {
                Id = Guid.NewGuid(),
                DeliveryReturnId = deliveryReturn.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            deliveryReturn.Items.Add(item);
        }

        deliveryReturn.TotalItems = deliveryReturn.Items.Count;

        _context.DeliveryReturns.Add(deliveryReturn);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryReturn",
            DocumentId = deliveryReturn.Id,
            DocumentNo = deliveryReturn.ReturnNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, add returned quantities back to freezer stock
        if (shouldAutoApprove)
        {
            var deliveryReturnWithItems = await _context.DeliveryReturns
                .Include(dr => dr.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(dr => dr.Id == deliveryReturn.Id, cancellationToken);

            if (deliveryReturnWithItems != null)
            {
                foreach (var item in deliveryReturnWithItems.Items)
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
                        Quantity = item.Quantity,
                        TransactionType = "DeliveryReturn",
                        Reason = $"Return from outlet {deliveryReturnWithItems.OutletId} - Auto-approved",
                        ReferenceNo = deliveryReturnWithItems.ReturnNo
                    }, userId, cancellationToken);
                }
            }
        }

        return await GetByIdAsync(deliveryReturn.Id, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created delivery return");
    }

    public async Task<DeliveryReturnDetailDto?> UpdateAsync(Guid id, UpdateDeliveryReturnDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .Include(dr => dr.Items)
            .FirstOrDefaultAsync(dr => dr.Id == id, cancellationToken);

        if (deliveryReturn == null)
            return null;

        if (deliveryReturn.Status != DeliveryReturnStatus.Pending)
            throw new InvalidOperationException("Only pending delivery returns can be updated");

        deliveryReturn.ReturnDate = DateTime.SpecifyKind(dto.ReturnDate, DateTimeKind.Utc);
        deliveryReturn.DeliveryNo = dto.DeliveryNo;
        deliveryReturn.DeliveredDate = DateTime.SpecifyKind(dto.DeliveredDate, DateTimeKind.Utc);
        deliveryReturn.OutletId = dto.OutletId;
        deliveryReturn.Reason = dto.Reason;
        deliveryReturn.UpdatedById = userId;
        deliveryReturn.UpdatedAt = DateTime.UtcNow;

        _context.DeliveryReturnItems.RemoveRange(deliveryReturn.Items);

        foreach (var itemDto in dto.Items)
        {
            var item = new DeliveryReturnItem
            {
                Id = itemDto.Id ?? Guid.NewGuid(),
                DeliveryReturnId = deliveryReturn.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            deliveryReturn.Items.Add(item);
        }

        deliveryReturn.TotalItems = deliveryReturn.Items.Count;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .FirstOrDefaultAsync(dr => dr.Id == id, cancellationToken);

        if (deliveryReturn == null)
            return false;

        if (deliveryReturn.Status != DeliveryReturnStatus.Pending)
            throw new InvalidOperationException("Only pending delivery returns can be deleted");

        deliveryReturn.IsActive = false;
        deliveryReturn.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<DeliveryReturnDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<DeliveryReturnDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .Include(dr => dr.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(dr => dr.Id == id, cancellationToken);

        if (deliveryReturn == null)
            return null;

        if (deliveryReturn.Status == DeliveryReturnStatus.Approved)
            throw new InvalidOperationException("This delivery return has already been approved.");

        if (deliveryReturn.Status != DeliveryReturnStatus.Pending)
            throw new InvalidOperationException("Only pending delivery returns can be approved");

        deliveryReturn.Status = DeliveryReturnStatus.Approved;
        deliveryReturn.ApprovedById = userId;
        deliveryReturn.ApprovedDate = DateTime.UtcNow;
        deliveryReturn.UpdatedById = userId;
        deliveryReturn.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryReturn",
            DocumentId = deliveryReturn.Id,
            DocumentNo = deliveryReturn.ReturnNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Add returned quantities back to freezer stock
        foreach (var item in deliveryReturn.Items)
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
                Quantity = item.Quantity,
                TransactionType = "DeliveryReturn",
                Reason = $"Return from outlet {deliveryReturn.OutletId}",
                ReferenceNo = deliveryReturn.ReturnNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DeliveryReturnDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _context.DeliveryReturns
            .FirstOrDefaultAsync(dr => dr.Id == id, cancellationToken);

        if (deliveryReturn == null)
            return null;

        if (deliveryReturn.Status != DeliveryReturnStatus.Pending)
            throw new InvalidOperationException("Only pending delivery returns can be rejected");

        deliveryReturn.Status = DeliveryReturnStatus.Draft;
        deliveryReturn.UpdatedById = userId;
        deliveryReturn.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "DeliveryReturn",
            DocumentId = deliveryReturn.Id,
            DocumentNo = deliveryReturn.ReturnNo,
            FromStatus = "Pending",
            ToStatus = "Draft",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
