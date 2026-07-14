using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Reconciliations;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ReconciliationService : IReconciliationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFreezerStockService _freezerStockService;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public ReconciliationService(
        ApplicationDbContext context, 
        IMapper mapper, 
        IFreezerStockService freezerStockService,
        IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _freezerStockService = freezerStockService;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<ReconciliationDetailDto> CreateReconciliationAsync(CreateReconciliationDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default)
    {
        var existingReconciliation = await _context.Reconciliations
            .FirstOrDefaultAsync(r => r.DeliveryPlanId == dto.DeliveryPlanId && 
                                     r.OutletId == dto.OutletId, 
                                cancellationToken);

        if (existingReconciliation != null)
            throw new InvalidOperationException("Reconciliation already exists for this delivery plan and outlet");

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("dms:reconciliation", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("reconciliation:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var reconciliationNo = await GenerateReconciliationNoAsync(cancellationToken);

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .Include(oi => oi.OrderHeader)
            .Where(oi => oi.OrderHeader!.DeliveryPlanId == dto.DeliveryPlanId && oi.OutletId == dto.OutletId)
            .ToListAsync(cancellationToken);

        var reconciliation = new Reconciliation
        {
            Id = Guid.NewGuid(),
            ReconciliationNo = reconciliationNo,
            ReconciliationDate = dto.ReconciliationDate,
            DeliveryPlanId = dto.DeliveryPlanId,
            OutletId = dto.OutletId,
            Status = shouldAutoApprove ? ReconciliationStatus.Submitted : ReconciliationStatus.InProgress,
            CreatedAt = DateTime.UtcNow
        };

        if (shouldAutoApprove)
        {
            reconciliation.SubmittedBy = userId;
            reconciliation.SubmittedAt = DateTime.UtcNow;
            reconciliation.UpdatedAt = DateTime.UtcNow;
        }

        var expectedQuantities = orderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Product = g.First().Product,
                ExpectedQty = g.Sum(oi => oi.FullQuantity + oi.MiniQuantity)
            })
            .ToList();

        foreach (var expected in expectedQuantities)
        {
            var item = new ReconciliationItem
            {
                Id = Guid.NewGuid(),
                ReconciliationId = reconciliation.Id,
                ProductId = expected.ProductId,
                ExpectedQty = expected.ExpectedQty,
                ActualQty = 0,
                VarianceQty = 0,
                VarianceType = VarianceType.Match,
                CreatedAt = DateTime.UtcNow
            };

            reconciliation.ReconciliationItems.Add(item);
        }

        _context.Reconciliations.Add(reconciliation);
        await _context.SaveChangesAsync(cancellationToken);

        // If auto-approved, apply freezer stock adjustments for variances
        if (shouldAutoApprove)
        {
            // Reload with includes for side effects
            var reconciliationWithItems = await _context.Reconciliations
                .Include(r => r.ReconciliationItems)
                    .ThenInclude(ri => ri.Product)
                .FirstOrDefaultAsync(r => r.Id == reconciliation.Id, cancellationToken);

            if (reconciliationWithItems != null)
            {
                foreach (var item in reconciliationWithItems.ReconciliationItems.Where(i => i.VarianceQty != 0))
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
                        Quantity = item.VarianceQty,
                        TransactionType = "ReconciliationAdjustment",
                        Reason = item.Reason ?? $"Reconciliation variance: {item.VarianceType}",
                        ReferenceNo = reconciliation.ReconciliationNo
                    }, userId, cancellationToken);
                }
            }
        }

        return await GetReconciliationByIdAsync(reconciliation.Id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve created reconciliation");
    }

    public async Task<ReconciliationDetailDto?> GetReconciliationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .Include(r => r.DeliveryPlan)
            .Include(r => r.Outlet)
            .Include(r => r.ReconciliationItems)
                .ThenInclude(ri => ri.Product)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reconciliation == null)
            return null;

        return _mapper.Map<ReconciliationDetailDto>(reconciliation);
    }

    public async Task<ReconciliationDetailDto?> GetByOutletAsync(Guid deliveryPlanId, Guid outletId, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .Include(r => r.DeliveryPlan)
            .Include(r => r.Outlet)
            .Include(r => r.ReconciliationItems)
                .ThenInclude(ri => ri.Product)
            .FirstOrDefaultAsync(r => r.DeliveryPlanId == deliveryPlanId && r.OutletId == outletId, cancellationToken);

        if (reconciliation == null)
            return null;

        return _mapper.Map<ReconciliationDetailDto>(reconciliation);
    }

    public async Task<List<ReconciliationListDto>> GetAllReconciliationsAsync(CancellationToken cancellationToken = default)
    {
        var reconciliations = await _context.Reconciliations
            .Include(r => r.DeliveryPlan)
            .Include(r => r.Outlet)
            .Include(r => r.ReconciliationItems)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ReconciliationListDto>>(reconciliations);
    }

    public async Task<ReconciliationDetailDto?> UpdateReconciliationAsync(Guid id, UpdateReconciliationDto dto, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reconciliation == null)
            return null;

        if (dto.ReconciliationDate.HasValue)
            reconciliation.ReconciliationDate = dto.ReconciliationDate.Value;

        if (dto.Status.HasValue)
            reconciliation.Status = dto.Status.Value;

        reconciliation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetReconciliationByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteReconciliationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .Include(r => r.ReconciliationItems)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reconciliation == null)
            return false;

        _context.Reconciliations.Remove(reconciliation);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ReconciliationDetailDto?> UpdateActualQuantitiesAsync(Guid id, UpdateActualQuantitiesDto dto, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .Include(r => r.ReconciliationItems)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reconciliation == null)
            return null;

        foreach (var itemDto in dto.Items)
        {
            var item = reconciliation.ReconciliationItems.FirstOrDefault(i => i.Id == itemDto.ItemId);
            if (item != null)
            {
                item.ActualQty = itemDto.ActualQty;
                item.VarianceQty = item.ActualQty - item.ExpectedQty;

                if (item.VarianceQty == 0)
                    item.VarianceType = VarianceType.Match;
                else if (item.VarianceQty < 0)
                    item.VarianceType = VarianceType.Shortage;
                else
                    item.VarianceType = VarianceType.Excess;

                if (!string.IsNullOrWhiteSpace(itemDto.Reason))
                    item.Reason = itemDto.Reason;

                item.UpdatedAt = DateTime.UtcNow;
            }
        }

        reconciliation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetReconciliationByIdAsync(id, cancellationToken);
    }

    public async Task<ReconciliationDetailDto?> SubmitReconciliationAsync(Guid id, Guid submittedBy, CancellationToken cancellationToken = default)
    {
        var reconciliation = await _context.Reconciliations
            .Include(r => r.ReconciliationItems)
                .ThenInclude(ri => ri.Product)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reconciliation == null)
            return null;

        if (reconciliation.Status != ReconciliationStatus.InProgress)
            throw new InvalidOperationException("Only in-progress reconciliations can be submitted");

        reconciliation.Status = ReconciliationStatus.Submitted;
        reconciliation.SubmittedBy = submittedBy;
        reconciliation.SubmittedAt = DateTime.UtcNow;
        reconciliation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Apply variance corrections to freezer stock
        foreach (var item in reconciliation.ReconciliationItems.Where(i => i.VarianceQty != 0))
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
                Quantity = item.VarianceQty,
                TransactionType = "ReconciliationAdjustment",
                Reason = item.Reason ?? $"Reconciliation variance: {item.VarianceType}",
                ReferenceNo = reconciliation.ReconciliationNo
            }, submittedBy, cancellationToken);
        }

        return await GetReconciliationByIdAsync(id, cancellationToken);
    }

    private async Task<string> GenerateReconciliationNoAsync(CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"REC-{year}-";

        var lastReconciliation = await _context.Reconciliations
            .Where(r => r.ReconciliationNo.StartsWith(prefix))
            .OrderByDescending(r => r.ReconciliationNo)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastReconciliation != null)
        {
            var lastNumberStr = lastReconciliation.ReconciliationNo.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D6}";
    }
}
