using DMS_Backend.Models.DTOs.ProductionApprovals;

namespace DMS_Backend.Services.Interfaces;

public interface IProductionApprovalService
{
    Task<ProductionApprovalsSummaryDto> GetPendingApprovalsAsync(CancellationToken cancellationToken = default);
}
