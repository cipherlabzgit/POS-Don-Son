using DMS_Backend.Models.DTOs.OperationApprovals;

namespace DMS_Backend.Models.DTOs.ProductionApprovals;

public sealed class ProductionApprovalsSummaryDto
{
    public List<OperationApprovalItemDto> DailyProductions { get; set; } = new();
    public List<OperationApprovalItemDto> ProductionCancels { get; set; } = new();
    public List<OperationApprovalItemDto> StockAdjustments { get; set; } = new();
    public List<OperationApprovalItemDto> DailyProductionPlans { get; set; } = new();

    public int TotalPendingCount =>
        DailyProductions.Count +
        ProductionCancels.Count +
        StockAdjustments.Count +
        DailyProductionPlans.Count;
}
