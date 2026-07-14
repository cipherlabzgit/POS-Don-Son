using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DeliveryTurns;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/delivery-turns")]
public class DeliveryTurnsController : ControllerBase
{
    private readonly IDeliveryTurnService _deliveryTurnService;

    public DeliveryTurnsController(IDeliveryTurnService deliveryTurnService)
    {
        _deliveryTurnService = deliveryTurnService;
    }

    [HttpGet]
    [HasPermission("delivery_turn:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (deliveryTurns, totalCount) = await _deliveryTurnService.GetAllAsync(
            page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DeliveryTurns = deliveryTurns,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("delivery_turn:view")]
    public async Task<ActionResult<ApiResponse<DeliveryTurnDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deliveryTurn = await _deliveryTurnService.GetByIdAsync(id, cancellationToken);
        if (deliveryTurn == null)
        {
            return NotFound(ApiResponse<DeliveryTurnDetailDto>.FailureResponse(
                Error.NotFound("DeliveryTurn", id.ToString())));
        }

        return Ok(ApiResponse<DeliveryTurnDetailDto>.SuccessResponse(deliveryTurn));
    }

    [HttpPost]
    [HasPermission("delivery_turn:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryTurnDetailDto>>> Create(
        [FromBody] CreateDeliveryTurnDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryTurn = await _deliveryTurnService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = deliveryTurn.Id },
                ApiResponse<DeliveryTurnDetailDto>.SuccessResponse(deliveryTurn));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DeliveryTurnDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("delivery_turn:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryTurnDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDeliveryTurnDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var deliveryTurn = await _deliveryTurnService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<DeliveryTurnDetailDto>.SuccessResponse(deliveryTurn));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<DeliveryTurnDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryTurn", id.ToString())));
            }

            return Conflict(ApiResponse<DeliveryTurnDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("delivery_turn:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _deliveryTurnService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Delivery turn deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("DeliveryTurn", id.ToString())));
        }
    }
}
