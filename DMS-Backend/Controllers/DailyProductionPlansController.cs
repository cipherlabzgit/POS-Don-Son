using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DailyProductionPlans;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/production-plans")]
public class DailyProductionPlansController : ControllerBase
{
    private readonly IDailyProductionPlanService _planService;

    public DailyProductionPlansController(IDailyProductionPlanService planService)
    {
        _planService = planService;
    }

    [HttpGet]
    [HasPermission("production:plan:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        CancellationToken cancellationToken = default)
    {
        var (plans, totalCount) = await _planService.GetAllAsync(
            page, pageSize, fromDate, toDate, productId, status, priority, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Plans = plans,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production:plan:view")]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var plan = await _planService.GetByIdAsync(id, cancellationToken);
        if (plan == null)
        {
            return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.NotFound("ProductionPlan", id.ToString())));
        }

        return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
    }

    [HttpGet("by-plan-no/{planNo}")]
    [HasPermission("production:plan:view")]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> GetByPlanNo(
        string planNo,
        CancellationToken cancellationToken = default)
    {
        var plan = await _planService.GetByPlanNoAsync(planNo, cancellationToken);
        if (plan == null)
        {
            return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.NotFound("ProductionPlan", planNo)));
        }

        return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
    }

    [HttpPost]
    [HasPermission("production:plan:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Create(
        [FromBody] CreateDailyProductionPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var plan = await _planService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = plan.Id },
                ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production:plan:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDailyProductionPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _planService.UpdateAsync(id, dto, userId, cancellationToken);

            if (plan == null)
            {
                return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production:plan:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _planService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Production plan deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("production:plan:update")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _planService.SubmitForApprovalAsync(id, userId, cancellationToken);

            if (plan == null)
            {
                return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("production:plan:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _planService.ApproveAsync(id, userId, cancellationToken);

            if (plan == null)
            {
                return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/start")]
    [HasPermission("production:plan:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Start(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _planService.StartAsync(id, userId, cancellationToken);

            if (plan == null)
            {
                return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/complete")]
    [HasPermission("production:plan:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DailyProductionPlanDetailDto>>> Complete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _planService.CompleteAsync(id, userId, cancellationToken);

            if (plan == null)
            {
                return NotFound(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                    Error.NotFound("ProductionPlan", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionPlanDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
