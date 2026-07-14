using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DeliveryPlans;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/delivery-plans")]
public class DeliveryPlansController : ControllerBase
{
    private readonly IDeliveryPlanService _deliveryPlanService;

    public DeliveryPlansController(IDeliveryPlanService deliveryPlanService)
    {
        _deliveryPlanService = deliveryPlanService;
    }

    [HttpGet("planning-window")]
    [HasPermission("delivery_plan:view")]
    public async Task<ActionResult<ApiResponse<DeliveryPlanningWindowDto>>> GetPlanningWindow(
        CancellationToken cancellationToken = default)
    {
        var dto = await _deliveryPlanService.GetPlanningWindowAsync(cancellationToken);
        return Ok(ApiResponse<DeliveryPlanningWindowDto>.SuccessResponse(dto));
    }

    [HttpGet]
    [HasPermission("delivery_plan:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        var (plans, totalCount) = await _deliveryPlanService.GetAllAsync(
            page, pageSize, fromDate, toDate, status, deliveryTurnId, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            DeliveryPlans = plans,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("delivery_plan:view|admin-delivery-plan:view")]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var plan = await _deliveryPlanService.GetByIdAsync(id, cancellationToken);
        if (plan == null)
        {
            return NotFound(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                Error.NotFound("DeliveryPlan", id.ToString())));
        }

        return Ok(ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
    }

    [HttpGet("by-plan-no/{planNo}")]
    [HasPermission("delivery_plan:view|admin-delivery-plan:view")]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> GetByPlanNo(
        string planNo,
        CancellationToken cancellationToken = default)
    {
        var plan = await _deliveryPlanService.GetByPlanNoAsync(planNo, cancellationToken);
        if (plan == null)
        {
            return NotFound(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                Error.NotFound("DeliveryPlan", planNo)));
        }

        return Ok(ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
    }

    [HttpPost]
    [HasPermission("delivery_plan:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> Create(
        [FromBody] CreateDeliveryPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _deliveryPlanService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = plan.Id },
                ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                    Error.Conflict(ex.Message)));
            }

            return BadRequest(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("delivery_plan:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDeliveryPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _deliveryPlanService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryPlan", id.ToString())));
            }

            return BadRequest(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("delivery_plan:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _deliveryPlanService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Delivery plan deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("DeliveryPlan", id.ToString())));
            }

            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("delivery_plan:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _deliveryPlanService.SubmitAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                    Error.NotFound("DeliveryPlan", id.ToString())));
            }

            return BadRequest(ApiResponse<DeliveryPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/items/bulk-upsert")]
    [HasPermission("delivery_plan:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeliveryPlanItemDto>>>> BulkUpsertItems(
        Guid id,
        [FromBody] List<BulkUpsertDeliveryPlanItemDto> items,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var results = await _deliveryPlanService.BulkUpsertItemsAsync(id, items, userId, cancellationToken);

            return Ok(ApiResponse<IEnumerable<DeliveryPlanItemDto>>.SuccessResponse(results));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<IEnumerable<DeliveryPlanItemDto>>.FailureResponse(
                    Error.NotFound("DeliveryPlan", id.ToString())));
            }

            return BadRequest(ApiResponse<IEnumerable<DeliveryPlanItemDto>>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpGet("outlet-schedule")]
    [HasPermission("delivery_plan:view")]
    public async Task<ActionResult<ApiResponse<List<OutletDeliveryScheduleDto>>>> GetOutletSchedule(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? outletId = null,
        [FromQuery] Guid? deliveryTurnId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _deliveryPlanService.GetOutletScheduleAsync(fromDate, toDate, outletId, deliveryTurnId, cancellationToken);
        return Ok(ApiResponse<List<OutletDeliveryScheduleDto>>.SuccessResponse(result));
    }
}
