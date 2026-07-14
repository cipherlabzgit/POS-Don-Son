using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ImmediateOrders;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/immediate-orders")]
public class ImmediateOrdersController : ControllerBase
{
    private readonly IImmediateOrderService _immediateOrderService;

    public ImmediateOrdersController(IImmediateOrderService immediateOrderService)
    {
        _immediateOrderService = immediateOrderService;
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool CurrentUserIsSuperAdmin() =>
        User.FindFirst("isSuperAdmin")?.Value.Equals("true", StringComparison.OrdinalIgnoreCase) == true;

    [HttpGet]
    [HasPermission("immediate_order:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        var (orders, totalCount) = await _immediateOrderService.GetAllAsync(
            page,
            pageSize,
            fromDate,
            toDate,
            status,
            outletId,
            deliveryTurnId,
            viewerUserId: CurrentUserId(),
            viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
            cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            ImmediateOrders = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("by-date-turn")]
    [HasPermission("immediate_order:view")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ImmediateOrderListDto>>>> GetByDateAndTurn(
        [FromQuery] DateTime date,
        [FromQuery] Guid turnId,
        CancellationToken cancellationToken = default)
    {
        var orders = await _immediateOrderService.GetByDateAndTurnAsync(
            date,
            turnId,
            viewerUserId: CurrentUserId(),
            viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
            cancellationToken);
        return Ok(ApiResponse<IEnumerable<ImmediateOrderListDto>>.SuccessResponse(orders));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("immediate_order:view")]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var order = await _immediateOrderService.GetByIdAsync(
            id,
            viewerUserId: CurrentUserId(),
            viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
            cancellationToken);
        if (order == null)
        {
            return NotFound(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.NotFound("ImmediateOrder", id.ToString())));
        }

        return Ok(ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
    }

    [HttpPost]
    [HasPermission("immediate_order:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> Create(
        [FromBody] CreateImmediateOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var order = await _immediateOrderService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("immediate_order:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateImmediateOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = CurrentUserId();
            var order = await _immediateOrderService.UpdateAsync(
                id,
                dto,
                userId,
                viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
                cancellationToken);

            return Ok(ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                    Error.NotFound("ImmediateOrder", id.ToString())));
            }

            return BadRequest(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("immediate_order:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _immediateOrderService.DeleteAsync(
                id,
                viewerUserId: CurrentUserId(),
                viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
                cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Immediate order deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("ImmediateOrder", id.ToString())));
            }

            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("immediate_order:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = CurrentUserId();
            var order = await _immediateOrderService.SubmitForApprovalAsync(
                id,
                userId,
                viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
                cancellationToken);

            return Ok(ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                    Error.NotFound("ImmediateOrder", id.ToString())));
            }

            return BadRequest(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("immediate_order:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = CurrentUserId();
            var order = await _immediateOrderService.ApproveAsync(
                id,
                approvedBy: userId,
                viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
                cancellationToken);

            return Ok(ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                    Error.NotFound("ImmediateOrder", id.ToString())));
            }

            return BadRequest(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("immediate_order:reject")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ImmediateOrderDetailDto>>> Reject(
        Guid id,
        [FromBody] RejectImmediateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = CurrentUserId();
            var order = await _immediateOrderService.RejectAsync(
                id,
                request.Reason,
                userId,
                viewerIsSuperAdmin: CurrentUserIsSuperAdmin(),
                cancellationToken);

            return Ok(ApiResponse<ImmediateOrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                    Error.NotFound("ImmediateOrder", id.ToString())));
            }

            return BadRequest(ApiResponse<ImmediateOrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}

public sealed class RejectImmediateOrderRequest
{
    public required string Reason { get; set; }
}
