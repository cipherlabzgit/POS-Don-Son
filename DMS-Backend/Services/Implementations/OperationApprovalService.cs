using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class OperationApprovalService : IOperationApprovalService
{
    private readonly IDeliveryService _deliveryService;
    private readonly ITransferService _transferService;
    private readonly IDisposalService _disposalService;
    private readonly ICancellationService _cancellationService;
    private readonly ILabelPrintRequestService _labelPrintRequestService;
    private readonly IStockBFService _stockBFService;
    private readonly IDeliveryReturnService _deliveryReturnService;
    private readonly IPosSaleService _posSaleService;
    private readonly IProductionApprovalService _productionApprovalService;
    private readonly IImmediateOrderService _immediateOrderService;
    private readonly IApprovalQueueService _approvalQueueService;
    private readonly ApplicationDbContext _context;

    public OperationApprovalService(
        IDeliveryService deliveryService,
        ITransferService transferService,
        IDisposalService disposalService,
        ICancellationService cancellationService,
        ILabelPrintRequestService labelPrintRequestService,
        IStockBFService stockBFService,
        IDeliveryReturnService deliveryReturnService,
        IPosSaleService posSaleService,
        IProductionApprovalService productionApprovalService,
        IImmediateOrderService immediateOrderService,
        IApprovalQueueService approvalQueueService,
        ApplicationDbContext context)
    {
        _deliveryService = deliveryService;
        _transferService = transferService;
        _disposalService = disposalService;
        _cancellationService = cancellationService;
        _labelPrintRequestService = labelPrintRequestService;
        _stockBFService = stockBFService;
        _deliveryReturnService = deliveryReturnService;
        _posSaleService = posSaleService;
        _productionApprovalService = productionApprovalService;
        _immediateOrderService = immediateOrderService;
        _approvalQueueService = approvalQueueService;
        _context = context;
    }

    public async Task<OperationApprovalsSummaryDto> GetPendingApprovalsAsync(Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var summary = new OperationApprovalsSummaryDto();

        // Execute sequentially to avoid DbContext threading issues
        // Each service call uses the same DbContext instance, which doesn't support concurrent operations
        var (deliveries, _) = await _deliveryService.GetAllAsync(1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (transfers, _) = await _transferService.GetAllAsync(1, int.MaxValue, null, null, null, null, "Pending", cancellationToken);
        var (disposals, _) = await _disposalService.GetAllAsync(1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (cancellations, _) = await _cancellationService.GetAllAsync(1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (labelPrintRequests, _) = await _labelPrintRequestService.GetAllAsync(1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (deliveryReturns, _) = await _deliveryReturnService.GetAllAsync(1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (stockBFs, _) = await _stockBFService.GetAllAsync(1, int.MaxValue, null, null, null, null, "Pending", requestingUserId, true, false, cancellationToken);
        var pendingPosSales = await _posSaleService.GetPendingSalesForApprovalsAsync(cancellationToken);

        summary.Deliveries = deliveries.Select(d => new OperationApprovalItemDto
        {
            Id = d.Id,
            ApprovalType = "Delivery",
            ReferenceNo = d.DeliveryNo,
            RequestDate = d.DeliveryDate,
            OutletName = d.OutletName,
            Status = d.Status,
            RequestedByName = d.CreatedByName,
            TotalValue = d.TotalValue,
            ItemCount = d.TotalItems
        }).ToList();

        summary.Transfers = transfers.Select(t => new OperationApprovalItemDto
        {
            Id = t.Id,
            ApprovalType = "Transfer",
            ReferenceNo = t.TransferNo,
            RequestDate = t.TransferDate,
            OutletName = $"{t.FromOutletName} → {t.ToOutletName}",
            Status = t.Status,
            RequestedByName = t.CreatedByName,
            ItemCount = t.TotalItems
        }).ToList();

        summary.Disposals = disposals.Select(d => new OperationApprovalItemDto
        {
            Id = d.Id,
            ApprovalType = "Disposal",
            ReferenceNo = d.DisposalNo,
            RequestDate = d.DisposalDate,
            OutletName = d.OutletName,
            Status = d.Status,
            RequestedByName = d.CreatedByName,
            ItemCount = d.TotalItems
        }).ToList();

        summary.Cancellations = cancellations.Select(c => new OperationApprovalItemDto
        {
            Id = c.Id,
            ApprovalType = "Cancellation",
            ReferenceNo = c.CancellationNo,
            RequestDate = c.CancellationDate,
            OutletName = c.OutletName,
            Status = c.Status,
            RequestedByName = c.UpdatedByName,
            Description = $"Delivery: {c.DeliveryNo}"
        }).ToList();

        summary.LabelPrintRequests = labelPrintRequests.Select(l => new OperationApprovalItemDto
        {
            Id = l.Id,
            ApprovalType = "Label Print",
            ReferenceNo = l.DisplayNo,
            RequestDate = l.Date,
            OutletName = l.ProductName,
            Status = l.Status,
            RequestedByName = l.UpdatedByName,
            ItemCount = l.LabelCount,
            Description = $"Product: {l.ProductCode}"
        }).ToList();

        summary.DeliveryReturns = deliveryReturns.Select(r => new OperationApprovalItemDto
        {
            Id = r.Id,
            ApprovalType = "Delivery Return",
            ReferenceNo = r.ReturnNo,
            RequestDate = r.ReturnDate,
            OutletName = r.OutletName,
            Status = r.Status,
            RequestedByName = r.UpdatedByName,
            ItemCount = r.TotalItems,
            Description = $"Delivery: {r.DeliveryNo}, Reason: {r.Reason}"
        }).ToList();

        summary.StockBFs = stockBFs
            .GroupBy(s => s.BFNo)  // Group by BF Number - all items with the same BFNo are part of the same submission
            .Select(g =>
            {
                var first = g.First();
                var itemCount = g.Count();
                var totalQty = g.Sum(s => s.Quantity);
                
                return new OperationApprovalItemDto
                {
                    Id = first.Id, // Use first item's ID as group representative
                    ApprovalType = "Stock BF",
                    ReferenceNo = first.BFNo,
                    RequestDate = first.BFDate,
                    OutletName = first.OutletName,
                    Status = first.Status,
                    RequestedByName = first.CreatedByName, // Use creator name, not updater
                    ItemCount = itemCount,
                    Description = itemCount == 1 
                        ? $"{first.ProductName} - Qty: {first.Quantity}"
                        : $"{itemCount} products - Total Qty: {totalQty}"
                };
            })
            .ToList();

        summary.PosSales = pendingPosSales.Select(s => new OperationApprovalItemDto
        {
            Id = s.Id,
            ApprovalType = "POS Sale",
            ReferenceNo = s.SaleNo,
            RequestDate = s.SoldAt,
            OutletName = s.Outlet?.Name ?? string.Empty,
            Status = s.Status.ToString(),
            RequestedByName = s.CreatedBy?.FullName ?? s.CreatedBy?.Email,
            TotalValue = s.TotalAmount,
            ItemCount = s.Lines.Count(l => l.IsActive),
            Description = $"{s.PaymentMethod} • {s.Lines.Count(l => l.IsActive)} line(s)"
        }).ToList();

        var pendingShowroomLabels = await _context.ShowroomLabelRequests
            .Include(r => r.Outlet)
            .Where(r => r.IsActive && r.Status == "Pending")
            .OrderByDescending(r => r.RequestDate)
            .ToListAsync(cancellationToken);

        summary.ShowroomLabelRequests = pendingShowroomLabels.Select(r => new OperationApprovalItemDto
        {
            Id = r.Id,
            ApprovalType = "Showroom Label",
            ReferenceNo = r.Text1,
            RequestDate = r.RequestDate,
            OutletName = r.Outlet?.Name ?? string.Empty,
            Status = r.Status,
            ItemCount = r.LabelCount,
            Description = r.Text2 != null ? $"Text: {r.Text1} / {r.Text2}" : $"Text: {r.Text1}"
        }).ToList();

        // 1. Fetch Production Approvals
        var productionSummary = await _productionApprovalService.GetPendingApprovalsAsync(cancellationToken);
        summary.DailyProductions = productionSummary.DailyProductions;
        summary.ProductionCancels = productionSummary.ProductionCancels;
        summary.StockAdjustments = productionSummary.StockAdjustments;
        summary.DailyProductionPlans = productionSummary.DailyProductionPlans;

        // 2. Fetch Immediate Orders (all outlets — internal summary; not scoped to a single user)
        var (immediateOrders, _) = await _immediateOrderService.GetAllAsync(
            1,
            int.MaxValue,
            fromDate: null,
            toDate: null,
            status: "Pending",
            outletId: null,
            deliveryTurnId: null,
            viewerUserId: null,
            viewerIsSuperAdmin: false,
            cancellationToken);
        summary.ImmediateOrders = immediateOrders.Select(o => new OperationApprovalItemDto
        {
            Id = o.Id,
            ApprovalType = "Immediate Order",
            ReferenceNo = o.OrderNo,
            RequestDate = o.OrderDate,
            OutletName = o.OutletName,
            Status = o.Status,
            RequestedByName = o.RequestedBy,
            Description = $"{o.ProductName} - Qty: {o.FullQuantity + o.MiniQuantity}"
        }).ToList();

        // 3. Fetch Administrator Approvals (generic queue)
        var (adminApprovals, _) = await _approvalQueueService.GetPendingAsync(1, int.MaxValue, null, cancellationToken);
        var posCancelRows = adminApprovals
            .Where(a => string.Equals(a.ApprovalType, PosSaleService.CancellationApprovalType, StringComparison.Ordinal))
            .ToList();
        var otherAdmin = adminApprovals
            .Where(a => !string.Equals(a.ApprovalType, PosSaleService.CancellationApprovalType, StringComparison.Ordinal))
            .ToList();

        var cancelSaleIds = posCancelRows.Select(a => a.EntityId).Distinct().ToList();
        var cancelSales = cancelSaleIds.Count == 0
            ? new Dictionary<Guid, PosSale>()
            : await _context.PosSales
                .AsNoTracking()
                .Include(s => s.Outlet)
                .Where(s => cancelSaleIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, cancellationToken);

        summary.PosCancellationRequests = posCancelRows.Select(a =>
        {
            cancelSales.TryGetValue(a.EntityId, out var sale);
            return new OperationApprovalItemDto
            {
                Id = a.Id,
                ApprovalType = PosSaleService.CancellationApprovalType,
                ReferenceNo = a.EntityReference ?? sale?.SaleNo ?? a.EntityId.ToString(),
                RequestDate = a.RequestedAt,
                OutletName = sale?.Outlet?.Name ?? "POS",
                Status = a.Status,
                RequestedByName = a.RequestedByName,
                Description = a.Notes,
                TotalValue = sale?.TotalAmount,
            };
        }).ToList();

        summary.AdminApprovals = otherAdmin.Select(a => new OperationApprovalItemDto
        {
            Id = a.Id,
            ApprovalType = a.ApprovalType,
            ReferenceNo = a.EntityReference ?? a.EntityId.ToString(),
            RequestDate = a.RequestedAt,
            OutletName = "System",
            Status = a.Status,
            RequestedByName = a.RequestedByName,
            Description = a.Notes
        }).ToList();

        return summary;
    }

    public async Task<OperationApprovalDto> RecordTransitionAsync(CreateOperationApprovalDto dto, Guid performedBy, CancellationToken cancellationToken = default)
    {
        var record = new Models.Entities.OperationApproval
        {
            DocumentType = dto.DocumentType,
            DocumentId   = dto.DocumentId,
            DocumentNo   = dto.DocumentNo,
            FromStatus   = dto.FromStatus,
            ToStatus     = dto.ToStatus,
            Action       = dto.Action,
            Remarks      = dto.Remarks,
            PerformedBy  = performedBy,
            PerformedAt  = DateTime.UtcNow,
        };

        _context.OperationApprovals.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(record).Reference(r => r.PerformedByUser).LoadAsync(cancellationToken);

        return ToDto(record);
    }

    public async Task<List<OperationApprovalDto>> GetByDocumentAsync(string documentType, Guid documentId, CancellationToken cancellationToken = default)
    {
        var records = await _context.OperationApprovals
            .AsNoTracking()
            .Include(r => r.PerformedByUser)
            .Where(r => r.DocumentType == documentType && r.DocumentId == documentId)
            .OrderBy(r => r.PerformedAt)
            .ToListAsync(cancellationToken);

        return records.Select(ToDto).ToList();
    }

    public async Task<List<OperationApprovalDto>> GetRecentAsync(int limit = 50, string? documentType = null, CancellationToken cancellationToken = default)
    {
        var query = _context.OperationApprovals
            .AsNoTracking()
            .Include(r => r.PerformedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(documentType))
            query = query.Where(r => r.DocumentType == documentType);

        var records = await query
            .OrderByDescending(r => r.PerformedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return records.Select(ToDto).ToList();
    }

    private static OperationApprovalDto ToDto(Models.Entities.OperationApproval r) => new()
    {
        Id              = r.Id,
        DocumentType    = r.DocumentType,
        DocumentId      = r.DocumentId,
        DocumentNo      = r.DocumentNo,
        FromStatus      = r.FromStatus,
        ToStatus        = r.ToStatus,
        Action          = r.Action,
        PerformedBy     = r.PerformedBy,
        PerformedByName = r.PerformedByUser?.FullName ?? r.PerformedByUser?.Email,
        PerformedAt     = r.PerformedAt,
        Remarks         = r.Remarks,
    };
}
