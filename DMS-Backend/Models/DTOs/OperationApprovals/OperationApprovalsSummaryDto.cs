namespace DMS_Backend.Models.DTOs.OperationApprovals;

public sealed class OperationApprovalsSummaryDto
{
    public List<OperationApprovalItemDto> Deliveries { get; set; } = new();
    public List<OperationApprovalItemDto> Transfers { get; set; } = new();
    public List<OperationApprovalItemDto> Disposals { get; set; } = new();
    public List<OperationApprovalItemDto> Cancellations { get; set; } = new();
    public List<OperationApprovalItemDto> LabelPrintRequests { get; set; } = new();
    public List<OperationApprovalItemDto> StockBFs { get; set; } = new();
    public List<OperationApprovalItemDto> DeliveryReturns { get; set; } = new();
    public List<OperationApprovalItemDto> PosSales { get; set; } = new();
    public List<OperationApprovalItemDto> PosCancellationRequests { get; set; } = new();
    public List<OperationApprovalItemDto> ShowroomLabelRequests { get; set; } = new();

    // Production Sections
    public List<OperationApprovalItemDto> DailyProductions { get; set; } = new();
    public List<OperationApprovalItemDto> ProductionCancels { get; set; } = new();
    public List<OperationApprovalItemDto> StockAdjustments { get; set; } = new();
    public List<OperationApprovalItemDto> DailyProductionPlans { get; set; } = new();

    // DMS Sections
    public List<OperationApprovalItemDto> ImmediateOrders { get; set; } = new();

    // Administrator Sections
    public List<OperationApprovalItemDto> AdminApprovals { get; set; } = new();

    public int TotalPendingCount =>
        Deliveries.Count +
        Transfers.Count +
        Disposals.Count +
        Cancellations.Count +
        LabelPrintRequests.Count +
        StockBFs.Count +
        DeliveryReturns.Count +
        PosSales.Count +
        PosCancellationRequests.Count +
        ShowroomLabelRequests.Count +
        DailyProductions.Count +
        ProductionCancels.Count +
        StockAdjustments.Count +
        DailyProductionPlans.Count +
        ImmediateOrders.Count +
        AdminApprovals.Count;
}
