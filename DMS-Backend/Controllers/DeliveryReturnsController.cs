using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DeliveryReturns;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/delivery-returns")]
public class DeliveryReturnsController : ControllerBase
{
    private readonly IDeliveryReturnService _deliveryReturnService;

    public DeliveryReturnsController(IDeliveryReturnService deliveryReturnService)
    {
        _deliveryReturnService = deliveryReturnService;
    }

    [HttpGet]
    [HasPermission("operation:delivery-return:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (deliveryReturns, totalCount) = await _deliveryReturnService.GetAllAsync(
            page, pageSize, fromDate, toDate, outletId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DeliveryReturns = deliveryReturns,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:delivery-return:view")]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deliveryReturn = await _deliveryReturnService.GetByIdAsync(id, cancellationToken);
        if (deliveryReturn == null)
        {
            return NotFound(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.NotFound("DeliveryReturn", id.ToString())));
        }

        return Ok(ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
    }

    [HttpPost]
    [HasPermission("operation:delivery-return:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> Create(
        [FromBody] CreateDeliveryReturnDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var deliveryReturn = await _deliveryReturnService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = deliveryReturn.Id },
                ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:delivery-return:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDeliveryReturnDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryReturn = await _deliveryReturnService.UpdateAsync(id, dto, userId, cancellationToken);

            if (deliveryReturn == null)
            {
                return NotFound(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryReturn", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:delivery-return:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _deliveryReturnService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("DeliveryReturn", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Delivery return deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:delivery-return:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryReturn = await _deliveryReturnService.SubmitAsync(id, userId, cancellationToken);

            if (deliveryReturn == null)
            {
                return NotFound(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryReturn", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:delivery-return:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryReturn = await _deliveryReturnService.ApproveAsync(id, userId, cancellationToken);

            if (deliveryReturn == null)
            {
                return NotFound(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryReturn", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:delivery-return:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryReturnDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryReturn = await _deliveryReturnService.RejectAsync(id, userId, cancellationToken);

            if (deliveryReturn == null)
            {
                return NotFound(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryReturn", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryReturnDetailDto>.SuccessResponse(deliveryReturn));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryReturnDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
