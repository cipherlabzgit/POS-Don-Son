using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Models.DTOs.PosSales;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class PosSaleService : IPosSaleService
{
    private readonly ApplicationDbContext _context;
    private readonly IOperationApprovalRecorder _approvalRecorder;

    public PosSaleService(ApplicationDbContext context, IOperationApprovalRecorder approvalRecorder)
    {
        _context = context;
        _approvalRecorder = approvalRecorder;
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc),
        };
    }

    private static string UserDisplayName(User? u) =>
        u == null ? string.Empty : (u.FullName ?? $"{u.FirstName} {u.LastName}".Trim());

    public async Task<(IReadOnlyList<PosSaleDetailDto> Sales, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId,
        DateTime? soldFromUtcInclusive,
        DateTime? soldToUtcExclusive,
        string? saleNoSearch,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PosSales
            .AsNoTracking()
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .Where(s => s.IsActive);

        if (outletId.HasValue)
            query = query.Where(s => s.OutletId == outletId.Value);

        if (soldFromUtcInclusive.HasValue)
            query = query.Where(s => s.SoldAt >= soldFromUtcInclusive.Value);

        if (soldToUtcExclusive.HasValue)
            query = query.Where(s => s.SoldAt < soldToUtcExclusive.Value);

        if (!string.IsNullOrWhiteSpace(saleNoSearch))
        {
            var term = saleNoSearch.Trim().ToLowerInvariant();
            query = query.Where(s => s.SaleNo.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PosSaleStatus>(status, true, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        var total = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(s => s.SoldAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (rows.Select(MapDetail).ToList(), total);
    }

    public async Task<PosSaleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sale = await _context.PosSales
            .AsNoTracking()
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.ApprovedBy)
            .Include(s => s.RejectedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        return sale == null ? null : MapDetail(sale);
    }

    public async Task<IReadOnlyList<PosSale>> GetPendingSalesForApprovalsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PosSales
            .AsNoTracking()
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.Lines)
            .Where(s => s.IsActive && s.Status == PosSaleStatus.Pending)
            .OrderByDescending(s => s.SoldAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PosSaleDetailDto> CreateAsync(
        CreatePosSaleDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new InvalidOperationException("At least one line item is required.");

        if (!string.IsNullOrWhiteSpace(dto.ClientMutationId))
        {
            var existing = await _context.PosSales
                .Include(s => s.Outlet)
                .Include(s => s.CreatedBy)
                .Include(s => s.ApprovedBy)
                .Include(s => s.RejectedBy)
                .Include(s => s.Lines)
                .ThenInclude(l => l.Product)
                .FirstOrDefaultAsync(
                    s => s.ClientMutationId == dto.ClientMutationId && s.OutletId == dto.OutletId && s.IsActive,
                    cancellationToken);
            if (existing != null)
                return MapDetail(existing);
        }

        var outletExists = await _context.Outlets.AnyAsync(o => o.Id == dto.OutletId && o.IsActive, cancellationToken);
        if (!outletExists)
            throw new InvalidOperationException("Outlet not found.");

        var productIds = dto.Lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
            throw new InvalidOperationException("One or more products are invalid or inactive.");

        var soldAt = dto.SoldAt.HasValue ? EnsureUtc(dto.SoldAt.Value) : DateTime.UtcNow;

        decimal total = 0;
        var now = DateTime.UtcNow;
        var sale = new PosSale
        {
            Id = Guid.NewGuid(),
            SoldAt = soldAt,
            PaymentMethod = dto.PaymentMethod.Trim(),
            TotalAmount = 0,
            ClientMutationId = string.IsNullOrWhiteSpace(dto.ClientMutationId) ? null : dto.ClientMutationId.Trim(),
            OutletId = dto.OutletId,
            Status = PosSaleStatus.Approved,
            ApprovedById = userId,
            ApprovedAt = now,
            CreatedById = userId,
            UpdatedById = userId,
            CreatedAt = now,
            UpdatedAt = now,
        };

        sale.SaleNo = string.Empty; // generated on SaveChanges

        foreach (var line in dto.Lines)
        {
            if (line.Quantity <= 0)
                throw new InvalidOperationException("Quantity must be greater than zero.");

            var lineTotal = Math.Round(line.Quantity * line.UnitPrice, 4, MidpointRounding.AwayFromZero);
            total += lineTotal;

            sale.Lines.Add(new PosSaleLine
            {
                Id = Guid.NewGuid(),
                PosSaleId = sale.Id,
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                LineTotal = lineTotal,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        sale.TotalAmount = Math.Round(total, 4, MidpointRounding.AwayFromZero);

        _context.PosSales.Add(sale);
        await _context.SaveChangesAsync(cancellationToken);

        var reloaded = await _context.PosSales
            .AsNoTracking()
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.ApprovedBy)
            .Include(s => s.RejectedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .FirstAsync(s => s.Id == sale.Id, cancellationToken);

        return MapDetail(reloaded);
    }

    public async Task<BulkPosSaleResultDto> CreateBulkAsync(
        CreateBulkPosSalesDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (dto.Sales == null || dto.Sales.Count == 0)
            throw new InvalidOperationException("At least one sale is required.");

        var results = new List<PosSaleDetailDto>();
        var errors = new List<BulkSaleError>();
        var successCount = 0;
        var skippedCount = 0;

        foreach (var saleDto in dto.Sales)
        {
            try
            {
                var created = await CreateAsync(saleDto, userId, cancellationToken);
                results.Add(created);
                
                // Check if this was an idempotent return (already existed)
                if (!string.IsNullOrWhiteSpace(saleDto.ClientMutationId))
                {
                    var wasExisting = created.ClientMutationId == saleDto.ClientMutationId;
                    if (wasExisting)
                        skippedCount++;
                    else
                        successCount++;
                }
                else
                {
                    successCount++;
                }
            }
            catch (Exception ex)
            {
                errors.Add(new BulkSaleError
                {
                    ClientMutationId = saleDto.ClientMutationId,
                    Message = ex.Message
                });
            }
        }

        return new BulkPosSaleResultDto
        {
            Sales = results,
            TotalProcessed = dto.Sales.Count,
            SuccessCount = successCount,
            SkippedCount = skippedCount,
            Errors = errors.Any() ? errors : null
        };
    }

    public async Task<PosSaleDetailDto?> ApproveAsync(Guid id, Guid approverUserId, CancellationToken cancellationToken = default)
    {
        var sale = await _context.PosSales
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (sale == null)
            return null;

        if (sale.Status == PosSaleStatus.Approved)
            throw new InvalidOperationException("This sale has already been approved.");

        if (sale.Status != PosSaleStatus.Pending)
            throw new InvalidOperationException("Only pending POS sales can be approved.");

        var now = DateTime.UtcNow;
        sale.Status = PosSaleStatus.Approved;
        sale.ApprovedById = approverUserId;
        sale.ApprovedAt = now;
        sale.RejectedById = null;
        sale.RejectedAt = null;
        sale.RejectionReason = null;
        sale.UpdatedById = approverUserId;
        sale.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "PosSale",
            DocumentId   = sale.Id,
            DocumentNo   = sale.SaleNo,
            FromStatus   = "Pending",
            ToStatus     = "Approved",
            Action       = "Approved",
        }, approverUserId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<PosSaleDetailDto?> RejectAsync(
        Guid id,
        Guid rejectorUserId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var sale = await _context.PosSales
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (sale == null)
            return null;

        if (sale.Status != PosSaleStatus.Pending)
            throw new InvalidOperationException("Only pending POS sales can be rejected.");

        var now = DateTime.UtcNow;
        sale.Status = PosSaleStatus.Rejected;
        sale.RejectedById = rejectorUserId;
        sale.RejectedAt = now;
        sale.RejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        sale.ApprovedById = null;
        sale.ApprovedAt = null;
        sale.UpdatedById = rejectorUserId;
        sale.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "PosSale",
            DocumentId   = sale.Id,
            DocumentNo   = sale.SaleNo,
            FromStatus   = "Pending",
            ToStatus     = "Rejected",
            Action       = "Rejected",
            Remarks      = sale.RejectionReason,
        }, rejectorUserId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<PosSaleDetailDto?> VoidAsync(
        Guid id,
        Guid userId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var sale = await _context.PosSales
            .Include(s => s.Lines)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);

        if (sale == null)
            return null;

        if (sale.Status == PosSaleStatus.Voided)
            throw new InvalidOperationException("This sale has already been voided.");

        if (sale.Status == PosSaleStatus.Pending)
            throw new InvalidOperationException("Pending sales must be rejected, not voided. Use the reject endpoint.");

        var fromStatus = sale.Status.ToString();
        var now = DateTime.UtcNow;
        sale.Status = PosSaleStatus.Voided;
        sale.RejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        sale.UpdatedById = userId;
        sale.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "PosSale",
            DocumentId   = sale.Id,
            DocumentNo   = sale.SaleNo,
            FromStatus   = fromStatus,
            ToStatus     = "Voided",
            Action       = "Voided",
            Remarks      = sale.RejectionReason,
        }, userId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private static PosSaleDetailDto MapDetail(PosSale s)
    {
        return new PosSaleDetailDto
        {
            Id = s.Id,
            SaleNo = s.SaleNo,
            SoldAt = s.SoldAt,
            PaymentMethod = s.PaymentMethod,
            TotalAmount = s.TotalAmount,
            ClientMutationId = s.ClientMutationId,
            OutletId = s.OutletId,
            OutletName = s.Outlet?.Name ?? string.Empty,
            Status = s.Status.ToString(),
            CreatedById = s.CreatedById,
            CreatedByName = UserDisplayName(s.CreatedBy),
            ApprovedAt = s.ApprovedAt,
            ApprovedByName = UserDisplayName(s.ApprovedBy),
            RejectedAt = s.RejectedAt,
            RejectedByName = UserDisplayName(s.RejectedBy),
            RejectionReason = s.RejectionReason,
            Lines = s.Lines
                .Where(l => l.IsActive)
                .Select(l => new PosSaleLineDetailDto
                {
                    Id = l.Id,
                    ProductId = l.ProductId,
                    ProductCode = l.Product?.Code ?? string.Empty,
                    ProductName = l.Product?.Name ?? string.Empty,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    LineTotal = l.LineTotal,
                })
                .ToList(),
        };
    }
}
