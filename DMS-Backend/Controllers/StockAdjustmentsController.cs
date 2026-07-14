using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.StockAdjustments;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/stock-adjustments")]
public class StockAdjustmentsController : ControllerBase
{
    private readonly IStockAdjustmentService _adjustmentService;

    public StockAdjustmentsController(IStockAdjustmentService adjustmentService)
    {
        _adjustmentService = adjustmentService;
    }

    [HttpGet]
    [HasPermission("production:stock-adjustment:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (adjustments, totalCount) = await _adjustmentService.GetAllAsync(
            page, pageSize, fromDate, toDate, productId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Adjustments = adjustments,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production:stock-adjustment:view")]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var adjustment = await _adjustmentService.GetByIdAsync(id, cancellationToken);
        if (adjustment == null)
        {
            return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.NotFound("StockAdjustment", id.ToString())));
        }

        return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
    }

    [HttpGet("by-adjustment-no/{adjustmentNo}")]
    [HasPermission("production:stock-adjustment:view")]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> GetByAdjustmentNo(
        string adjustmentNo,
        CancellationToken cancellationToken = default)
    {
        var adjustment = await _adjustmentService.GetByAdjustmentNoAsync(adjustmentNo, cancellationToken);
        if (adjustment == null)
        {
            return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.NotFound("StockAdjustment", adjustmentNo)));
        }

        return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
    }

    [HttpPost]
    [HasPermission("production:stock-adjustment:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> Create(
        [FromBody] CreateStockAdjustmentDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var adjustment = await _adjustmentService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = adjustment.Id },
                ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production:stock-adjustment:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateStockAdjustmentDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var adjustment = await _adjustmentService.UpdateAsync(id, dto, userId, cancellationToken);

            if (adjustment == null)
            {
                return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                    Error.NotFound("StockAdjustment", id.ToString())));
            }

            return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production:stock-adjustment:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _adjustmentService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("StockAdjustment", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Stock adjustment deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("production:stock-adjustment:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var adjustment = await _adjustmentService.SubmitAsync(id, userId, cancellationToken);

            if (adjustment == null)
            {
                return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                    Error.NotFound("StockAdjustment", id.ToString())));
            }

            return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("production:stock-adjustment:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var adjustment = await _adjustmentService.ApproveAsync(id, userId, cancellationToken);

            if (adjustment == null)
            {
                return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                    Error.NotFound("StockAdjustment", id.ToString())));
            }

            return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("production:stock-adjustment:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockAdjustmentDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var adjustment = await _adjustmentService.RejectAsync(id, userId, cancellationToken);

            if (adjustment == null)
            {
                return NotFound(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                    Error.NotFound("StockAdjustment", id.ToString())));
            }

            return Ok(ApiResponse<StockAdjustmentDetailDto>.SuccessResponse(adjustment));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockAdjustmentDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
