using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Transfers;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class TransferService : ITransferService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public TransferService(ApplicationDbContext context, IMapper mapper, IFreezerStockService freezerStockService, IOperationApprovalRecorder approvalRecorder, IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _freezerStockService = freezerStockService;
        _approvalRecorder = approvalRecorder;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<(List<TransferListDto> Transfers, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? fromOutletId, Guid? toOutletId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.Transfers
            .Include(t => t.FromOutlet)
            .Include(t => t.ToOutlet)
            .Include(t => t.CreatedBy)
            .Include(t => t.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(t => t.TransferDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.TransferDate <= toDate.Value);

        if (fromOutletId.HasValue)
            query = query.Where(t => t.FromOutletId == fromOutletId.Value);

        if (toOutletId.HasValue)
            query = query.Where(t => t.ToOutletId == toOutletId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TransferStatus>(status, true, out var statusEnum))
            query = query.Where(t => t.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var transfers = await query
            .OrderByDescending(t => t.TransferDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<TransferListDto>>(transfers), totalCount);
    }

    public async Task<TransferDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .Include(t => t.FromOutlet)
            .Include(t => t.ToOutlet)
            .Include(t => t.CreatedBy)
            .Include(t => t.ApprovedBy)
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return null;

        return _mapper.Map<TransferDetailDto>(transfer);
    }

    public async Task<TransferDetailDto?> GetByTransferNoAsync(string transferNo, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .Include(t => t.FromOutlet)
            .Include(t => t.ToOutlet)
            .Include(t => t.CreatedBy)
            .Include(t => t.ApprovedBy)
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(t => t.TransferNo == transferNo, cancellationToken);

        if (transfer == null)
            return null;

        return _mapper.Map<TransferDetailDto>(transfer);
    }

    public async Task<TransferDetailDto> CreateAsync(CreateTransferDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        if (dto.FromOutletId == dto.ToOutletId)
            throw new InvalidOperationException("From outlet and To outlet must be different");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:transfer", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:transfer:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var transfer = new Transfer
        {
            Id = Guid.NewGuid(),
            TransferDate = DateTime.SpecifyKind(dto.TransferDate, DateTimeKind.Utc),
            FromOutletId = dto.FromOutletId,
            ToOutletId = dto.ToOutletId,
            Status = shouldAutoApprove ? TransferStatus.Approved : TransferStatus.Pending,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            transfer.ApprovedById = userId;
            transfer.ApprovedDate = DateTime.UtcNow;
        }

        foreach (var itemDto in dto.Items)
        {
            var item = new TransferItem
            {
                Id = Guid.NewGuid(),
                TransferId = transfer.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            transfer.Items.Add(item);
        }

        transfer.TotalItems = transfer.Items.Count;

        _context.Transfers.Add(transfer);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new Models.DTOs.OperationApprovals.CreateOperationApprovalDto
        {
            DocumentType = "Transfer",
            DocumentId = transfer.Id,
            DocumentNo = transfer.TransferNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, deduct stock immediately from source
        if (shouldAutoApprove)
        {
            var transferWithItems = await _context.Transfers
                .Include(t => t.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(t => t.Id == transfer.Id, cancellationToken);

            if (transferWithItems != null)
            {
                foreach (var item in transferWithItems.Items)
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
                        TransactionType = "TransferOut",
                        Reason = $"Transfer from outlet {transferWithItems.FromOutletId} to {transferWithItems.ToOutletId} - Auto-approved",
                        ReferenceNo = transferWithItems.TransferNo
                    }, userId, cancellationToken);
                }
            }
        }

        return await GetByIdAsync(transfer.Id, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created transfer");
    }

    public async Task<TransferDetailDto?> UpdateAsync(Guid id, UpdateTransferDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return null;

        if (transfer.Status != TransferStatus.Pending)
            throw new InvalidOperationException("Only pending transfers can be updated");

        if (dto.FromOutletId == dto.ToOutletId)
            throw new InvalidOperationException("From outlet and To outlet must be different");

        transfer.TransferDate = DateTime.SpecifyKind(dto.TransferDate, DateTimeKind.Utc);
        transfer.FromOutletId = dto.FromOutletId;
        transfer.ToOutletId = dto.ToOutletId;
        transfer.Notes = dto.Notes;
        transfer.UpdatedById = userId;
        transfer.UpdatedAt = DateTime.UtcNow;

        _context.TransferItems.RemoveRange(transfer.Items);

        foreach (var itemDto in dto.Items)
        {
            var item = new TransferItem
            {
                Id = itemDto.Id ?? Guid.NewGuid(),
                TransferId = transfer.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            transfer.Items.Add(item);
        }

        transfer.TotalItems = transfer.Items.Count;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return false;

        if (transfer.Status != TransferStatus.Pending)
            throw new InvalidOperationException("Only pending transfers can be deleted");

        transfer.IsActive = false;
        transfer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<TransferDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<TransferDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return null;

        if (transfer.Status == TransferStatus.Approved)
            throw new InvalidOperationException("This transfer has already been approved.");

        if (transfer.Status != TransferStatus.Pending)
            throw new InvalidOperationException("Only pending transfers can be approved");

        // Stock availability check on source before approving
        var stockShortages = new List<string>();
        foreach (var item in transfer.Items)
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
                $"Insufficient stock for transfer. Shortages: {string.Join("; ", stockShortages)}");

        transfer.Status = TransferStatus.Approved;
        transfer.ApprovedById = userId;
        transfer.ApprovedDate = DateTime.UtcNow;
        transfer.UpdatedById = userId;
        transfer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Move stock: deduct from source section, add to destination section
        // For transfers between showrooms, we deduct from the product's default production section
        // and add to the same section (showroom stock is tracked separately via StockBF)
        foreach (var item in transfer.Items)
        {
            if (item.Product == null) continue;
            var productionSection = await _context.ProductionSections
                .FirstOrDefaultAsync(ps => ps.IsActive &&
                    item.Product.ProductionSection != null &&
                    ps.Name == item.Product.ProductionSection,
                    cancellationToken);

            if (productionSection == null) continue;

            // Deduct from source (freezer stock is the central pool, outlet transfers are tracked for reconciliation)
            await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
            {
                ProductId = item.ProductId,
                ProductionSectionId = productionSection.Id,
                Quantity = -item.Quantity,
                TransactionType = "TransferOut",
                Reason = $"Transfer from outlet {transfer.FromOutletId} to {transfer.ToOutletId}",
                ReferenceNo = transfer.TransferNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<TransferDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return null;

        if (transfer.Status != TransferStatus.Pending)
            throw new InvalidOperationException("Only pending transfers can be rejected");

        transfer.Status = TransferStatus.Rejected;
        transfer.UpdatedById = userId;
        transfer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<TransferDetailDto?> CompleteReceiptAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var transfer = await _context.Transfers
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transfer == null)
            return null;

        if (transfer.Status != TransferStatus.Approved)
            throw new InvalidOperationException("Only approved transfers can be marked as received at the destination.");

        transfer.Status = TransferStatus.Completed;
        transfer.UpdatedById = userId;
        transfer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
