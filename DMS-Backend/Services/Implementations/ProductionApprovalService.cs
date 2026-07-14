using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Models.DTOs.ProductionApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ProductionApprovalService : IProductionApprovalService
{
    private readonly IDailyProductionService _dailyProductionService;
    private readonly IProductionCancelService _productionCancelService;
    private readonly IStockAdjustmentService _stockAdjustmentService;
    private readonly IDailyProductionPlanService _dailyProductionPlanService;

    public ProductionApprovalService(
        IDailyProductionService dailyProductionService,
        IProductionCancelService productionCancelService,
        IStockAdjustmentService stockAdjustmentService,
        IDailyProductionPlanService dailyProductionPlanService)
    {
        _dailyProductionService = dailyProductionService;
        _productionCancelService = productionCancelService;
        _stockAdjustmentService = stockAdjustmentService;
        _dailyProductionPlanService = dailyProductionPlanService;
    }

    public async Task<ProductionApprovalsSummaryDto> GetPendingApprovalsAsync(CancellationToken cancellationToken = default)
    {
        var summary = new ProductionApprovalsSummaryDto();

        var (dailyProductions, _) = await _dailyProductionService.GetAllAsync(
            1, int.MaxValue, null, null, null, "Pending",
            Guid.Empty, viewAllRecords: true, showPreviousRecords: true, cancellationToken);
        var (productionCancels, _) = await _productionCancelService.GetAllAsync(
            1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (stockAdjustments, _) = await _stockAdjustmentService.GetAllAsync(
            1, int.MaxValue, null, null, null, "Pending", cancellationToken);
        var (dailyPlans, _) = await _dailyProductionPlanService.GetAllAsync(
            1, int.MaxValue, null, null, null, "PendingApproval", null, cancellationToken);

        summary.DailyProductions = dailyProductions.Select(p => new OperationApprovalItemDto
        {
            Id = p.Id,
            ApprovalType = "Daily Production",
            ReferenceNo = p.ProductionNo,
            RequestDate = p.ProductionDate,
            OutletName = $"{p.TotalItems} item(s)",
            Status = p.Status,
            RequestedByName = p.CreatedByName,
            Description = $"Shift: {p.ShiftName} — Total Qty: {p.TotalProducedQty}"
        }).ToList();

        summary.ProductionCancels = productionCancels.Select(c => new OperationApprovalItemDto
        {
            Id = c.Id,
            ApprovalType = "Production Cancel",
            ReferenceNo = c.CancelNo,
            RequestDate = c.CancelDate,
            OutletName = $"{c.TotalItems} item(s)",
            Status = c.Status,
            RequestedByName = c.CreatedByName,
            Description = $"Production: {c.ProductionNo}, Total Qty: {c.TotalQty}"
        }).ToList();

        summary.StockAdjustments = stockAdjustments.Select(s => new OperationApprovalItemDto
        {
            Id = s.Id,
            ApprovalType = "Stock Adjustment",
            ReferenceNo = s.AdjustmentNo,
            RequestDate = s.AdjustmentDate,
            OutletName = s.ProductName,
            Status = s.Status,
            RequestedByName = s.CreatedByName,
            Description = $"{s.AdjustmentType} {s.Quantity} — {s.Reason}"
        }).ToList();

        summary.DailyProductionPlans = dailyPlans.Select(p => new OperationApprovalItemDto
        {
            Id = p.Id,
            ApprovalType = "Production Plan",
            ReferenceNo = p.PlanNo,
            RequestDate = p.PlanDate,
            OutletName = p.ProductName,
            Status = p.Status,
            RequestedByName = p.CreatedByName,
            Description = $"Planned qty: {p.PlannedQty}, Priority: {p.Priority}"
        }).ToList();

        return summary;
    }
}
