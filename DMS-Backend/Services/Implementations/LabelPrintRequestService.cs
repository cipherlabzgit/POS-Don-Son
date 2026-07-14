using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.LabelPrintRequests;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class LabelPrintRequestService : ILabelPrintRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public LabelPrintRequestService(
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

    public async Task<(List<LabelPrintRequestListDto> LabelPrintRequests, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? productId, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.LabelPrintRequests
            .Include(l => l.Product)
            .Include(l => l.UpdatedBy)
            .Include(l => l.ApprovedBy)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(l => l.Date >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(l => l.Date <= toDate.Value);

        if (productId.HasValue)
            query = query.Where(l => l.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LabelPrintStatus>(status, true, out var statusEnum))
            query = query.Where(l => l.Status == statusEnum);

        var totalCount = await query.CountAsync(cancellationToken);

        var labelPrintRequests = await query
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (_mapper.Map<List<LabelPrintRequestListDto>>(labelPrintRequests), totalCount);
    }

    public async Task<LabelPrintRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .Include(l => l.Product)
            .Include(l => l.ApprovedBy)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (labelPrintRequest == null)
            return null;

        return _mapper.Map<LabelPrintRequestDetailDto>(labelPrintRequest);
    }

    public async Task<LabelPrintRequestDetailDto?> GetByDisplayNoAsync(string displayNo, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .Include(l => l.Product)
            .Include(l => l.ApprovedBy)
            .FirstOrDefaultAsync(l => l.DisplayNo == displayNo, cancellationToken);

        if (labelPrintRequest == null)
            return null;

        return _mapper.Map<LabelPrintRequestDetailDto>(labelPrintRequest);
    }

    public async Task<LabelPrintRequestDetailDto> CreateAsync(CreateLabelPrintRequestDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId, cancellationToken);

        if (product == null)
            throw new InvalidOperationException("Product not found");

        if (!product.EnableLabelPrint)
            throw new InvalidOperationException("Label printing is not enabled for this product");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("operation:label-printing", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("operation:label-printing:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var labelPrintRequest = new LabelPrintRequest
        {
            Id = Guid.NewGuid(),
            Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
            ProductId = dto.ProductId,
            LabelCount = dto.LabelCount,
            StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
            ExpiryDays = dto.ExpiryDays,
            PriceOverride = dto.PriceOverride,
            Status = shouldAutoApprove ? LabelPrintStatus.Approved : LabelPrintStatus.Pending,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            labelPrintRequest.ApprovedById = userId;
            labelPrintRequest.ApprovedDate = DateTime.UtcNow;
        }

        _context.LabelPrintRequests.Add(labelPrintRequest);
        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "LabelPrintRequest",
            DocumentId = labelPrintRequest.Id,
            DocumentNo = labelPrintRequest.DisplayNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        return await GetByIdAsync(labelPrintRequest.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created label print request");
    }

    public async Task<LabelPrintRequestDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<LabelPrintRequestDetailDto?> UpdateAsync(Guid id, UpdateLabelPrintRequestDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (labelPrintRequest == null)
            return null;

        if (labelPrintRequest.Status != LabelPrintStatus.Pending)
            throw new InvalidOperationException("Only pending label print requests can be updated");

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId, cancellationToken);

        if (product == null)
            throw new InvalidOperationException("Product not found");

        if (!product.EnableLabelPrint)
            throw new InvalidOperationException("Label printing is not enabled for this product");

        labelPrintRequest.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        labelPrintRequest.ProductId = dto.ProductId;
        labelPrintRequest.LabelCount = dto.LabelCount;
        labelPrintRequest.StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
        labelPrintRequest.ExpiryDays = dto.ExpiryDays;
        labelPrintRequest.PriceOverride = dto.PriceOverride;
        labelPrintRequest.UpdatedById = userId;
        labelPrintRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (labelPrintRequest == null)
            return false;

        if (labelPrintRequest.Status != LabelPrintStatus.Pending)
            throw new InvalidOperationException("Only pending label print requests can be deleted");

        labelPrintRequest.IsActive = false;
        labelPrintRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<LabelPrintRequestDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (labelPrintRequest == null)
            return null;

        if (labelPrintRequest.Status != LabelPrintStatus.Pending)
            throw new InvalidOperationException("Only pending label print requests can be approved");

        labelPrintRequest.Status = LabelPrintStatus.Approved;
        labelPrintRequest.ApprovedById = userId;
        labelPrintRequest.ApprovedDate = DateTime.UtcNow;
        labelPrintRequest.UpdatedById = userId;
        labelPrintRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "LabelPrintRequest",
            DocumentId = labelPrintRequest.Id,
            DocumentNo = labelPrintRequest.DisplayNo,
            FromStatus = "Pending",
            ToStatus = "Approved",
            Action = "Approved",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<LabelPrintRequestDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _context.LabelPrintRequests
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (labelPrintRequest == null)
            return null;

        if (labelPrintRequest.Status != LabelPrintStatus.Pending)
            throw new InvalidOperationException("Only pending label print requests can be rejected");

        labelPrintRequest.Status = LabelPrintStatus.Rejected;
        labelPrintRequest.UpdatedById = userId;
        labelPrintRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "LabelPrintRequest",
            DocumentId = labelPrintRequest.Id,
            DocumentNo = labelPrintRequest.DisplayNo,
            FromStatus = "Pending",
            ToStatus = "Rejected",
            Action = "Rejected",
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
