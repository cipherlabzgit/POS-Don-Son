using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Transfers;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/transfers")]
public class TransfersController : ControllerBase
{
    private readonly ITransferService _transferService;

    public TransfersController(ITransferService transferService)
    {
        _transferService = transferService;
    }

    [HttpGet]
    [HasPermission("operation:transfer:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? fromOutletId = null,
        [FromQuery] Guid? toOutletId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (transfers, totalCount) = await _transferService.GetAllAsync(
            page, pageSize, fromDate, toDate, fromOutletId, toOutletId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Transfers = transfers,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:transfer:view")]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var transfer = await _transferService.GetByIdAsync(id, cancellationToken);
        if (transfer == null)
        {
            return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.NotFound("Transfer", id.ToString())));
        }

        return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
    }

    [HttpPost]
    [HasPermission("operation:transfer:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> Create(
        [FromBody] CreateTransferDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var transfer = await _transferService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = transfer.Id },
                ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:transfer:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateTransferDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transfer = await _transferService.UpdateAsync(id, dto, userId, cancellationToken);

            if (transfer == null)
            {
                return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:transfer:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _transferService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Transfer deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:transfer:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transfer = await _transferService.SubmitAsync(id, userId, cancellationToken);

            if (transfer == null)
            {
                return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:transfer:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transfer = await _transferService.ApproveAsync(id, userId, cancellationToken);

            if (transfer == null)
            {
                return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:transfer:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transfer = await _transferService.RejectAsync(id, userId, cancellationToken);

            if (transfer == null)
            {
                return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/complete-receipt")]
    [HasPermission("operation:transfer:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<TransferDetailDto>>> CompleteReceipt(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var transfer = await _transferService.CompleteReceiptAsync(id, userId, cancellationToken);

            if (transfer == null)
            {
                return NotFound(ApiResponse<TransferDetailDto>.FailureResponse(
                    Error.NotFound("Transfer", id.ToString())));
            }

            return Ok(ApiResponse<TransferDetailDto>.SuccessResponse(transfer));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<TransferDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
