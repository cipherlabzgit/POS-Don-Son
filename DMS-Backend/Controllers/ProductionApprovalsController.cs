using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ProductionApprovals;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/production-approvals")]
public class ProductionApprovalsController : ControllerBase
{
    private readonly IProductionApprovalService _productionApprovalService;

    public ProductionApprovalsController(IProductionApprovalService productionApprovalService)
    {
        _productionApprovalService = productionApprovalService;
    }

    [HttpGet("pending")]
    [HasPermission("production:approvals:view")]
    public async Task<ActionResult<ApiResponse<ProductionApprovalsSummaryDto>>> GetPendingApprovals(
        CancellationToken cancellationToken = default)
    {
        var summary = await _productionApprovalService.GetPendingApprovalsAsync(cancellationToken);
        return Ok(ApiResponse<ProductionApprovalsSummaryDto>.SuccessResponse(summary));
    }
}
