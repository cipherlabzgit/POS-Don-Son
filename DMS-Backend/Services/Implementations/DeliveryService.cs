using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Deliveries;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class DeliveryService : IDeliveryService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public DeliveryService(
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

    public async Task<(List<DeliveryListDto> Deliveries, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? outletId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(d => d.DeliveryDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(d => d.DeliveryDate <= toDate.Value);

        if (outletId.HasValue)
            query = query.Where(d => d.OutletId == outletId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DeliveryStatus>(status, true, out var statusEnum))
            query = query.Where(d => d.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var deliveries = await query
            .OrderByDescending(d => d.DeliveryDate)
            .ThenByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<DeliveryListDto>>(deliveries), totalCount);
    }

    public async Task<DeliveryDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.CreatedBy)
            .Include(d => d.ApprovedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (delivery == null)
            return null;

        return _mapper.Map<DeliveryDetailDto>(delivery);
    }

    public async Task<DeliveryDetailDto?> GetByDeliveryNoAsync(string deliveryNo, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .Include(d => d.Outlet)
            .Include(d => d.ApprovedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.DeliveryNo == deliveryNo, cancellationToken);

        if (delivery == null)
            return null;

        return _mapper.Map<DeliveryDetailDto>(delivery);
    }

    public async Task<DeliveryDetailDto> CreateAsync(
        CreateDeliveryDto dto,
        Guid userId,
        IReadOnlyCollection<string> permissionCodes,
        CancellationToken cancellationToken = default)
    {
        DeliveryDatePolicy.ValidateForCreate(dto.DeliveryDate, permissionCodes);

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:delivery", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:delivery:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var delivery = new Delivery
        {
            Id = Guid.NewGuid(),
            DeliveryDate = DateTime.SpecifyKind(dto.DeliveryDate, DateTimeKind.Utc),
            OutletId = dto.OutletId,
            Status = shouldAutoApprove ? DeliveryStatus.Approved : DeliveryStatus.Pending,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            delivery.ApprovedById = userId;
            delivery.ApprovedDate = DateTime.UtcNow;
        }

        foreach (var itemDto in dto.Items)
        {
            var item = new DeliveryItem
            {
                Id = Guid.NewGuid(),
                DeliveryId = delivery.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Total = itemDto.Quantity * itemDto.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            delivery.Items.Add(item);
        }

        delivery.TotalItems = delivery.Items.Count;
        delivery.TotalValue = delivery.Items.Sum(i => i.Total);

        _context.Deliveries.Add(delivery);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Delivery",
            DocumentId = delivery.Id,
            DocumentNo = delivery.DeliveryNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, deduct stock immediately for each item
        if (shouldAutoApprove)
        {
            var deliveryWithItems = await _context.Deliveries
                .Include(d => d.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(d => d.Id == delivery.Id, cancellationToken);

            if (deliveryWithItems != null)
            {
                foreach (var item in deliveryWithItems.Items)
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
                        TransactionType = "Delivery",
                        Reason = $"Delivery to outlet {deliveryWithItems.OutletId} - Auto-approved",
                        ReferenceNo = deliveryWithItems.DeliveryNo
                    }, userId, cancellationToken);
                }
            }
        }

        return await GetByIdAsync(delivery.Id, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created delivery");
    }

    public async Task<DeliveryDetailDto?> UpdateAsync(
        Guid id,
        UpdateDeliveryDto dto,
        Guid userId,
        IReadOnlyCollection<string> permissionCodes,
        CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (delivery == null)
            return null;

        if (delivery.Status != DeliveryStatus.Pending)
            throw new InvalidOperationException("Only pending deliveries can be updated");

        DeliveryDatePolicy.ValidateForUpdate(dto.DeliveryDate, delivery.DeliveryDate, permissionCodes);

        delivery.DeliveryDate = DateTime.SpecifyKind(dto.DeliveryDate, DateTimeKind.Utc);
        delivery.OutletId = dto.OutletId;
        delivery.Notes = dto.Notes;
        delivery.UpdatedById = userId;
        delivery.UpdatedAt = DateTime.UtcNow;

        _context.DeliveryItems.RemoveRange(delivery.Items);

        foreach (var itemDto in dto.Items)
        {
            var item = new DeliveryItem
            {
                Id = itemDto.Id ?? Guid.NewGuid(),
                DeliveryId = delivery.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Total = itemDto.Quantity * itemDto.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            delivery.Items.Add(item);
        }

        delivery.TotalItems = delivery.Items.Count;
        delivery.TotalValue = delivery.Items.Sum(i => i.Total);

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (delivery == null)
            return false;

        if (delivery.Status != DeliveryStatus.Pending)
            throw new InvalidOperationException("Only pending deliveries can be deleted");

        delivery.IsActive = false;
        delivery.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<DeliveryDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<DeliveryDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (delivery == null)
            return null;

        if (delivery.Status == DeliveryStatus.Approved)
            throw new InvalidOperationException("This delivery has already been approved.");

        if (delivery.Status != DeliveryStatus.Pending)
            throw new InvalidOperationException("Only pending deliveries can be approved");

        // Stock availability check per item before any changes
        var stockShortages = new List<string>();
        foreach (var item in delivery.Items)
        {
            if (item.Product == null) continue;
            var productionSection = await _context.ProductionSections
                .FirstOrDefaultAsync(ps => ps.IsActive &&
                    item.Product.ProductionSection != null &&
                    ps.Name == item.Product.ProductionSection,
                    cancellationToken);

            if (productionSection == null) continue;

            var stock = await _context.Set<FreezerStock>()
                .FirstOrDefaultAsync(fs =>
                    fs.ProductId == item.ProductId &&
                    fs.ProductionSectionId == productionSection.Id,
                    cancellationToken);

            var available = stock?.CurrentStock ?? 0;
            if (item.Quantity > available)
                stockShortages.Add($"{item.Product.Name}: required {item.Quantity}, available {available}");
        }

        if (stockShortages.Any())
            throw new InvalidOperationException(
                $"Insufficient stock for approval. Shortages: {string.Join("; ", stockShortages)}");

        delivery.Status = DeliveryStatus.Approved;
        delivery.ApprovedById = userId;
        delivery.ApprovedDate = DateTime.UtcNow;
        delivery.UpdatedById = userId;
        delivery.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Delivery",
            DocumentId = delivery.Id,
            DocumentNo = delivery.DeliveryNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Deduct each item from freezer stock
        foreach (var item in delivery.Items)
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
                TransactionType = "Delivery",
                Reason = $"Delivery to outlet {delivery.OutletId}",
                ReferenceNo = delivery.DeliveryNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<DeliveryDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Deliveries
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (delivery == null)
            return null;

        if (delivery.Status != DeliveryStatus.Pending)
            throw new InvalidOperationException("Only pending deliveries can be rejected");

        delivery.Status = DeliveryStatus.Rejected;
        delivery.UpdatedById = userId;
        delivery.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "Delivery",
            DocumentId = delivery.Id,
            DocumentNo = delivery.DeliveryNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
