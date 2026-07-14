using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.ProductionCancels;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ProductionCancelService : IProductionCancelService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public ProductionCancelService(
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

    public async Task<(List<ProductionCancelListDto> Cancellations, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.ProductionCancels
            .Include(p => p.Lines)
                .ThenInclude(l => l.Product)
            .Include(p => p.Lines)
                .ThenInclude(l => l.ProductionSection)
            .Include(p => p.CreatedBy)
            .Include(p => p.ApprovedBy)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(p => p.CancelDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(p => p.CancelDate <= toDate.Value);

        if (productId.HasValue)
            query = query.Where(p => p.Lines.Any(l => l.ProductId == productId.Value));

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ProductionCancelStatus>(status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var cancellations = await query
            .OrderByDescending(p => p.CancelDate)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<ProductionCancelListDto>>(cancellations), totalCount);
    }

    public async Task<ProductionCancelDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .Include(p => p.Lines)
                .ThenInclude(l => l.Product)
            .Include(p => p.Lines)
                .ThenInclude(l => l.ProductionSection)
            .Include(p => p.CreatedBy)
            .Include(p => p.ApprovedBy)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        return _mapper.Map<ProductionCancelDetailDto>(cancellation);
    }

    public async Task<ProductionCancelDetailDto?> GetByCancelNoAsync(string cancelNo, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .Include(p => p.Lines)
                .ThenInclude(l => l.Product)
            .Include(p => p.Lines)
                .ThenInclude(l => l.ProductionSection)
            .Include(p => p.CreatedBy)
            .Include(p => p.ApprovedBy)
            .FirstOrDefaultAsync(p => p.CancelNo == cancelNo && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        return _mapper.Map<ProductionCancelDetailDto>(cancellation);
    }

    public async Task<ProductionCancelDetailDto> CreateAsync(CreateProductionCancelDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("production:cancel", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("production:cancel:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        // If auto-approval is enabled, validate stock BEFORE creating the cancellation
        if (shouldAutoApprove)
        {
            var stockValidationErrors = new List<string>();
            int lineNumber = 1;
            
            foreach (var lineDto in dto.Lines)
            {
                var currentStock = await _freezerStockService.GetCurrentStockAsync(
                    lineDto.ProductId, 
                    lineDto.ProductionSectionId, 
                    cancellationToken);
                
                var availableQty = currentStock?.CurrentStock ?? 0;
                
                if (availableQty < lineDto.CancelledQty)
                {
                    var product = await _context.Products.FindAsync(lineDto.ProductId);
                    var section = await _context.ProductionSections.FindAsync(lineDto.ProductionSectionId);
                    
                    stockValidationErrors.Add(
                        $"Line {lineNumber}: {product?.Name ?? "Product"} in {section?.Name ?? "Section"} - " +
                        $"Available: {availableQty:F2}, Required: {lineDto.CancelledQty:F2}");
                }
                lineNumber++;
            }
            
            // If any stock validation errors, throw BEFORE creating anything
            if (stockValidationErrors.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot auto-approve production cancellation due to insufficient stock:\n" +
                    string.Join("\n", stockValidationErrors));
            }
        }

        var cancellation = new ProductionCancel
        {
            Id = Guid.NewGuid(),
            CancelDate = DateTime.SpecifyKind(dto.CancelDate, DateTimeKind.Utc),
            ProductionNo = dto.ProductionNo,
            Reason = dto.Reason,
            Status = shouldAutoApprove ? ProductionCancelStatus.Approved : ProductionCancelStatus.Pending,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            cancellation.ApprovedById = userId;
            cancellation.ApprovedDate = DateTime.UtcNow;
        }

        // Create lines
        int lineNo = 1;
        foreach (var lineDto in dto.Lines)
        {
            var line = new ProductionCancelLine
            {
                Id = Guid.NewGuid(),
                ProductId = lineDto.ProductId,
                ProductionSectionId = lineDto.ProductionSectionId,
                CancelledQty = lineDto.CancelledQty,
                LineNo = lineNo++,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
            cancellation.Lines.Add(line);
        }

        _context.ProductionCancels.Add(cancellation);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ProductionCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancelNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        // If auto-approved, adjust stock immediately for each cancelled line
        // (Stock was already validated before creating the cancellation)
        if (shouldAutoApprove)
        {
            foreach (var line in cancellation.Lines)
            {
                await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
                {
                    ProductId = line.ProductId,
                    ProductionSectionId = line.ProductionSectionId,
                    Quantity = -line.CancelledQty, // Negative because we're removing stock
                    TransactionType = "ProductionCancel",
                    Reason = $"{cancellation.Reason} (Line {line.LineNo}) - Auto-approved",
                    ReferenceNo = cancellation.CancelNo
                }, userId, cancellationToken);
            }
        }

        return await GetByIdAsync(cancellation.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created cancellation");
    }

    public async Task<ProductionCancelDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != ProductionCancelStatus.Draft)
            throw new InvalidOperationException("Only draft production cancellations can be submitted");

        cancellation.Status = ProductionCancelStatus.Pending;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ProductionCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancelNo,
            FromStatus = "Draft",
            ToStatus = "Pending",
            Action = "Submitted",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ProductionCancelDetailDto?> UpdateAsync(Guid id, UpdateProductionCancelDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .Include(p => p.Lines)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != ProductionCancelStatus.Pending)
            throw new InvalidOperationException("Only pending production cancellations can be updated");

        cancellation.CancelDate = DateTime.SpecifyKind(dto.CancelDate, DateTimeKind.Utc);
        cancellation.ProductionNo = dto.ProductionNo;
        cancellation.Reason = dto.Reason;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        // Update lines: Remove old lines and add new ones
        _context.ProductionCancelLines.RemoveRange(cancellation.Lines);

        int lineNo = 1;
        foreach (var lineDto in dto.Lines)
        {
            var line = new ProductionCancelLine
            {
                Id = Guid.NewGuid(),
                ProductionCancelId = cancellation.Id,
                ProductId = lineDto.ProductId,
                ProductionSectionId = lineDto.ProductionSectionId,
                CancelledQty = lineDto.CancelledQty,
                LineNo = lineNo++,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
            cancellation.Lines.Add(line);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return false;

        if (cancellation.Status != ProductionCancelStatus.Pending)
            throw new InvalidOperationException("Only pending production cancellations can be deleted");

        cancellation.IsActive = false;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ProductionCancelDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .Include(p => p.Lines)
                .ThenInclude(l => l.Product)
            .Include(p => p.Lines)
                .ThenInclude(l => l.ProductionSection)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status == ProductionCancelStatus.Approved)
            throw new InvalidOperationException("This production cancellation has already been approved.");

        if (cancellation.Status != ProductionCancelStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be approved");

        cancellation.Status = ProductionCancelStatus.Approved;
        cancellation.ApprovedById = userId;
        cancellation.ApprovedDate = DateTime.UtcNow;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ProductionCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancelNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        // Adjust freezer stock for each cancelled line
        foreach (var line in cancellation.Lines)
        {
            await _freezerStockService.AdjustStockAsync(new AdjustFreezerStockDto
            {
                ProductId = line.ProductId,
                ProductionSectionId = line.ProductionSectionId,
                Quantity = -line.CancelledQty, // Negative because we're removing stock
                TransactionType = "ProductionCancel",
                Reason = $"{cancellation.Reason} (Line {line.LineNo})",
                ReferenceNo = cancellation.CancelNo
            }, userId, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ProductionCancelDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cancellation = await _context.ProductionCancels
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        if (cancellation == null)
            return null;

        if (cancellation.Status != ProductionCancelStatus.Pending)
            throw new InvalidOperationException("Only pending cancellations can be rejected");

        cancellation.Status = ProductionCancelStatus.Rejected;
        cancellation.UpdatedById = userId;
        cancellation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ProductionCancel",
            DocumentId = cancellation.Id,
            DocumentNo = cancellation.CancelNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
