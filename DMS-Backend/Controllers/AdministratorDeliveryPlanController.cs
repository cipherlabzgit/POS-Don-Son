using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.AdministratorDeliveryPlan;
using DMS_Backend.Models.DTOs.DeliveryPlans;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

/// <summary>
/// Administrator Delivery Plan: schedules (day types), planning window, and quick create with delivery sync.
/// </summary>
[Authorize]
[ApiController]
[Route("api/administrator/delivery-plan")]
public sealed class AdministratorDeliveryPlanController : ControllerBase
{
    private readonly IAdministratorDeliveryPlanService _service;

    public AdministratorDeliveryPlanController(IAdministratorDeliveryPlanService service)
    {
        _service = service;
    }

    [HttpGet("schedules")]
    [HasPermission("admin-delivery-plan:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetSchedules(CancellationToken cancellationToken = default)
    {
        var list = await _service.GetSchedulesAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { Schedules = list, TotalCount = list.Count }));
    }

    [HttpGet("window")]
    [HasPermission("admin-delivery-plan:view")]
    public async Task<ActionResult<ApiResponse<AdministratorDeliveryPlanWindowDto>>> GetWindow(
        CancellationToken cancellationToken = default)
    {
        var dto = await _service.GetPlanningWindowAsync(cancellationToken);
        return Ok(ApiResponse<AdministratorDeliveryPlanWindowDto>.SuccessResponse(dto));
    }

    [HttpGet("upcoming-plans")]
    [HasPermission("admin-delivery-plan:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetUpcomingPlans(CancellationToken cancellationToken = default)
    {
        var list = await _service.GetPlansInWindowAsync(cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { DeliveryPlans = list, TotalCount = list.Count }));
    }

    [HttpPost("quick-create")]
    [HasPermission("admin-delivery-plan:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<DeliveryPlanDetailDto>>> QuickCreate(
        [FromBody] AdministratorQuickCreateDeliveryPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var plan = await _service.QuickCreateAndSyncAsync(dto, userId, permissions, cancellationToken);
            return Ok(ApiResponse<DeliveryPlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                ApiResponse<DeliveryPlanDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
