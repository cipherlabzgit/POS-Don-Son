using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ProductionCancels;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/production-cancels")]
public class ProductionCancelsController : ControllerBase
{
    private readonly IProductionCancelService _cancelService;

    public ProductionCancelsController(IProductionCancelService cancelService)
    {
        _cancelService = cancelService;
    }

    [HttpGet]
    [HasPermission("production:cancel:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (cancellations, totalCount) = await _cancelService.GetAllAsync(
            page, pageSize, fromDate, toDate, productId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Cancellations = cancellations,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production:cancel:view")]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var cancellation = await _cancelService.GetByIdAsync(id, cancellationToken);
        if (cancellation == null)
        {
            return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.NotFound("ProductionCancel", id.ToString())));
        }

        return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
    }

    [HttpGet("by-cancel-no/{cancelNo}")]
    [HasPermission("production:cancel:view")]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> GetByCancelNo(
        string cancelNo,
        CancellationToken cancellationToken = default)
    {
        var cancellation = await _cancelService.GetByCancelNoAsync(cancelNo, cancellationToken);
        if (cancellation == null)
        {
            return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.NotFound("ProductionCancel", cancelNo)));
        }

        return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
    }

    [HttpPost]
    [HasPermission("production:cancel:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> Create(
        [FromBody] CreateProductionCancelDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var cancellation = await _cancelService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = cancellation.Id },
                ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production:cancel:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateProductionCancelDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancelService.UpdateAsync(id, dto, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                    Error.NotFound("ProductionCancel", id.ToString())));
            }

            return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production:cancel:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _cancelService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("ProductionCancel", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Production cancellation deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("production:cancel:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancel = await _cancelService.SubmitAsync(id, userId, cancellationToken);

            if (cancel == null)
            {
                return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                    Error.NotFound("ProductionCancel", id.ToString())));
            }

            return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancel));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("production:cancel:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancelService.ApproveAsync(id, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                    Error.NotFound("ProductionCancel", id.ToString())));
            }

            return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("production:cancel:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<ProductionCancelDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancelService.RejectAsync(id, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                    Error.NotFound("ProductionCancel", id.ToString())));
            }

            return Ok(ApiResponse<ProductionCancelDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductionCancelDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
