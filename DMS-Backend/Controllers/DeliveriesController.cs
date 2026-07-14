using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Deliveries;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/deliveries")]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;

    public DeliveriesController(IDeliveryService deliveryService)
    {
        _deliveryService = deliveryService;
    }

    [HttpGet]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (deliveries, totalCount) = await _deliveryService.GetAllAsync(
            page, pageSize, fromDate, toDate, outletId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Deliveries = deliveries,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var delivery = await _deliveryService.GetByIdAsync(id, cancellationToken);
        if (delivery == null)
        {
            return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.NotFound("Delivery", id.ToString())));
        }

        return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
    }

    [HttpGet("by-delivery-no/{deliveryNo}")]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> GetByDeliveryNo(
        string deliveryNo,
        CancellationToken cancellationToken = default)
    {
        var delivery = await _deliveryService.GetByDeliveryNoAsync(deliveryNo, cancellationToken);
        if (delivery == null)
        {
            return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.NotFound("Delivery", deliveryNo)));
        }

        return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
    }

    [HttpPost]
    [HasPermission("operation:delivery:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> Create(
        [FromBody] CreateDeliveryDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissionCodes = User.FindAll("permission").Select(c => c.Value).ToArray();
            var delivery = await _deliveryService.CreateAsync(dto, userId, permissionCodes, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = delivery.Id },
                ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:delivery:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDeliveryDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissionCodes = User.FindAll("permission").Select(c => c.Value).ToArray();
            var delivery = await _deliveryService.UpdateAsync(id, dto, userId, permissionCodes, cancellationToken);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                    Error.NotFound("Delivery", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:delivery:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _deliveryService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("Delivery", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Delivery deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:delivery:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var delivery = await _deliveryService.SubmitAsync(id, userId, cancellationToken);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                    Error.NotFound("Delivery", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:delivery:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var delivery = await _deliveryService.ApproveAsync(id, userId, cancellationToken);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                    Error.NotFound("Delivery", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:delivery:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DeliveryDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var delivery = await _deliveryService.RejectAsync(id, userId, cancellationToken);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDetailDto>.FailureResponse(
                    Error.NotFound("Delivery", id.ToString())));
            }

            return Ok(ApiResponse<DeliveryDetailDto>.SuccessResponse(delivery));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DeliveryDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
