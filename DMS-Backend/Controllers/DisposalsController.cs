using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Disposals;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/disposals")]
public class DisposalsController : ControllerBase
{
    private readonly IDisposalService _disposalService;

    public DisposalsController(IDisposalService disposalService)
    {
        _disposalService = disposalService;
    }

    [HttpGet]
    [HasPermission("operation:disposal:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (disposals, totalCount) = await _disposalService.GetAllAsync(
            page, pageSize, fromDate, toDate, outletId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Disposals = disposals,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:disposal:view")]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var disposal = await _disposalService.GetByIdAsync(id, cancellationToken);
        if (disposal == null)
        {
            return NotFound(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.NotFound("Disposal", id.ToString())));
        }

        return Ok(ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
    }

    [HttpPost]
    [HasPermission("operation:disposal:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> Create(
        [FromBody] CreateDisposalDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var disposal = await _disposalService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = disposal.Id },
                ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:disposal:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDisposalDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var disposal = await _disposalService.UpdateAsync(id, dto, userId, cancellationToken);

            if (disposal == null)
            {
                return NotFound(ApiResponse<DisposalDetailDto>.FailureResponse(
                    Error.NotFound("Disposal", id.ToString())));
            }

            return Ok(ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:disposal:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _disposalService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("Disposal", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Disposal deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:disposal:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var disposal = await _disposalService.SubmitAsync(id, userId, cancellationToken);

            if (disposal == null)
            {
                return NotFound(ApiResponse<DisposalDetailDto>.FailureResponse(
                    Error.NotFound("Disposal", id.ToString())));
            }

            return Ok(ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:disposal:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var disposal = await _disposalService.ApproveAsync(id, userId, cancellationToken);

            if (disposal == null)
            {
                return NotFound(ApiResponse<DisposalDetailDto>.FailureResponse(
                    Error.NotFound("Disposal", id.ToString())));
            }

            return Ok(ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:disposal:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DisposalDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var disposal = await _disposalService.RejectAsync(id, userId, cancellationToken);

            if (disposal == null)
            {
                return NotFound(ApiResponse<DisposalDetailDto>.FailureResponse(
                    Error.NotFound("Disposal", id.ToString())));
            }

            return Ok(ApiResponse<DisposalDetailDto>.SuccessResponse(disposal));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DisposalDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
