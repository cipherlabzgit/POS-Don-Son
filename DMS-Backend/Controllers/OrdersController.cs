using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Orders;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [HasPermission("order:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? deliveryPlanId = null,
        [FromQuery] bool customOrdersOnly = false,
        CancellationToken cancellationToken = default)
    {
        var (orders, totalCount) = await _orderService.GetAllAsync(
            page, pageSize, fromDate, toDate, status, deliveryPlanId, customOrdersOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Orders = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("order:view")]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderService.GetByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return NotFound(ApiResponse<OrderDetailDto>.FailureResponse(
                Error.NotFound("Order", id.ToString())));
        }

        return Ok(ApiResponse<OrderDetailDto>.SuccessResponse(order));
    }

    [HttpGet("by-order-no/{orderNo}")]
    [HasPermission("order:view")]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> GetByOrderNo(
        string orderNo,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderService.GetByOrderNoAsync(orderNo, cancellationToken);
        if (order == null)
        {
            return NotFound(ApiResponse<OrderDetailDto>.FailureResponse(
                Error.NotFound("Order", orderNo)));
        }

        return Ok(ApiResponse<OrderDetailDto>.SuccessResponse(order));
    }

    [HttpGet("by-date-turn")]
    [HasPermission("order:view")]
    public async Task<ActionResult<ApiResponse<IEnumerable<OrderListDto>>>> GetByDateAndTurn(
        [FromQuery] DateTime date,
        [FromQuery] Guid turnId,
        CancellationToken cancellationToken = default)
    {
        var orders = await _orderService.GetByDateAndTurnAsync(date, turnId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<OrderListDto>>.SuccessResponse(orders));
    }

    [HttpPost]
    [HasPermission("order:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> Create(
        [FromBody] CreateOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var order = await _orderService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                ApiResponse<OrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<OrderDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("order:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var order = await _orderService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<OrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<OrderDetailDto>.FailureResponse(
                    Error.NotFound("Order", id.ToString())));
            }

            return BadRequest(ApiResponse<OrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("order:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _orderService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Order deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("Order", id.ToString())));
            }

            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("order:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var order = await _orderService.SubmitAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<OrderDetailDto>.SuccessResponse(order));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<OrderDetailDto>.FailureResponse(
                    Error.NotFound("Order", id.ToString())));
            }

            return BadRequest(ApiResponse<OrderDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/items/bulk-upsert")]
    [HasPermission("order:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<IEnumerable<OrderItemDto>>>> BulkUpsertItems(
        Guid id,
        [FromBody] List<BulkUpsertOrderItemDto> items,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var results = await _orderService.BulkUpsertItemsAsync(id, items, userId, cancellationToken);

            return Ok(ApiResponse<IEnumerable<OrderItemDto>>.SuccessResponse(results));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<IEnumerable<OrderItemDto>>.FailureResponse(
                    Error.NotFound("Order", id.ToString())));
            }

            return BadRequest(ApiResponse<IEnumerable<OrderItemDto>>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
