using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/operation-approvals")]
public class OperationApprovalsController : ControllerBase
{
    private readonly IOperationApprovalService _operationApprovalService;

    public OperationApprovalsController(IOperationApprovalService operationApprovalService)
    {
        _operationApprovalService = operationApprovalService;
    }

    [HttpGet("pending")]
    [HasPermission("operation:approvals:view")]
    public async Task<ActionResult<ApiResponse<OperationApprovalsSummaryDto>>> GetPendingApprovals(
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var summary = await _operationApprovalService.GetPendingApprovalsAsync(userId, cancellationToken);
        return Ok(ApiResponse<OperationApprovalsSummaryDto>.SuccessResponse(summary));
    }

    [HttpGet("document/{documentType}/{documentId:guid}")]
    [HasPermission("operation:approvals:view")]
    public async Task<ActionResult<ApiResponse<List<OperationApprovalDto>>>> GetByDocument(
        string documentType, Guid documentId, CancellationToken cancellationToken = default)
    {
        var records = await _operationApprovalService.GetByDocumentAsync(documentType, documentId, cancellationToken);
        return Ok(ApiResponse<List<OperationApprovalDto>>.SuccessResponse(records));
    }

    [HttpGet("recent")]
    [HasPermission("operation:approvals:view")]
    public async Task<ActionResult<ApiResponse<List<OperationApprovalDto>>>> GetRecent(
        [FromQuery] int limit = 50,
        [FromQuery] string? documentType = null,
        CancellationToken cancellationToken = default)
    {
        var records = await _operationApprovalService.GetRecentAsync(limit, documentType, cancellationToken);
        return Ok(ApiResponse<List<OperationApprovalDto>>.SuccessResponse(records));
    }

    [HttpPost("record")]
    [HasPermission("operation:approvals:create")]
    public async Task<ActionResult<ApiResponse<OperationApprovalDto>>> RecordTransition(
        [FromBody] CreateOperationApprovalDto dto, CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var record = await _operationApprovalService.RecordTransitionAsync(dto, userId, cancellationToken);
        return Ok(ApiResponse<OperationApprovalDto>.SuccessResponse(record));
    }
}
