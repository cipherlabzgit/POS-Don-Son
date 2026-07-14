using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Cancellations;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/cancellations")]
public class CancellationsController : ControllerBase
{
    private readonly ICancellationService _cancellationService;

    public CancellationsController(ICancellationService cancellationService)
    {
        _cancellationService = cancellationService;
    }

    [HttpGet]
    [HasPermission("operation:cancellation:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (cancellations, totalCount) = await _cancellationService.GetAllAsync(
            page, pageSize, fromDate, toDate, outletId, status, cancellationToken);

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
    [HasPermission("operation:cancellation:view")]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var cancellation = await _cancellationService.GetByIdAsync(id, cancellationToken);
        if (cancellation == null)
        {
            return NotFound(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.NotFound("Cancellation", id.ToString())));
        }

        return Ok(ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
    }

    [HttpPost]
    [HasPermission("operation:cancellation:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> Create(
        [FromBody] CreateCancellationDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var cancellation = await _cancellationService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = cancellation.Id },
                ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:cancellation:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateCancellationDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancellationService.UpdateAsync(id, dto, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<CancellationDetailDto>.FailureResponse(
                    Error.NotFound("Cancellation", id.ToString())));
            }

            return Ok(ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:cancellation:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _cancellationService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("Cancellation", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Cancellation deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:cancellation:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancellationService.SubmitAsync(id, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<CancellationDetailDto>.FailureResponse(
                    Error.NotFound("Cancellation", id.ToString())));
            }

            return Ok(ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:cancellation:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancellationService.ApproveAsync(id, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<CancellationDetailDto>.FailureResponse(
                    Error.NotFound("Cancellation", id.ToString())));
            }

            return Ok(ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:cancellation:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<CancellationDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cancellation = await _cancellationService.RejectAsync(id, userId, cancellationToken);

            if (cancellation == null)
            {
                return NotFound(ApiResponse<CancellationDetailDto>.FailureResponse(
                    Error.NotFound("Cancellation", id.ToString())));
            }

            return Ok(ApiResponse<CancellationDetailDto>.SuccessResponse(cancellation));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CancellationDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
