using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ApprovalQueue;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/approvals")]
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalQueueService _approvalQueueService;

    public ApprovalsController(IApprovalQueueService approvalQueueService)
    {
        _approvalQueueService = approvalQueueService;
    }

    [HttpGet("pending")]
    [HasPermission("approval:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetPending(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? approvalType = null,
        CancellationToken cancellationToken = default)
    {
        var (approvals, totalCount) = await _approvalQueueService.GetPendingAsync(
            page, pageSize, approvalType, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Approvals = approvals,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet]
    [HasPermission("approval:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? approvalType = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (approvals, totalCount) = await _approvalQueueService.GetAllAsync(
            page, pageSize, approvalType, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Approvals = approvals,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("approval:view")]
    public async Task<ActionResult<ApiResponse<ApprovalQueueDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var approval = await _approvalQueueService.GetByIdAsync(id, cancellationToken);
        if (approval == null)
        {
            return NotFound(ApiResponse<ApprovalQueueDetailDto>.FailureResponse(
                Error.NotFound("Approval", id.ToString())));
        }

        return Ok(ApiResponse<ApprovalQueueDetailDto>.SuccessResponse(approval));
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("approval:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ApprovalQueueDetailDto>>> Approve(
        Guid id,
        [FromBody] ApproveApprovalDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var approval = await _approvalQueueService.ApproveAsync(id, userId, dto.Notes, cancellationToken);

            return Ok(ApiResponse<ApprovalQueueDetailDto>.SuccessResponse(approval));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ApprovalQueueDetailDto>.FailureResponse(
                    Error.NotFound("Approval", id.ToString())));
            }

            return BadRequest(ApiResponse<ApprovalQueueDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("approval:reject")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ApprovalQueueDetailDto>>> Reject(
        Guid id,
        [FromBody] RejectApprovalDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var approval = await _approvalQueueService.RejectAsync(id, userId, dto.RejectionReason, dto.Notes, cancellationToken);

            return Ok(ApiResponse<ApprovalQueueDetailDto>.SuccessResponse(approval));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ApprovalQueueDetailDto>.FailureResponse(
                    Error.NotFound("Approval", id.ToString())));
            }

            return BadRequest(ApiResponse<ApprovalQueueDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
