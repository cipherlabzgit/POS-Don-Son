using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.RecipePlans;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/recipe-plans")]
[Authorize]
public class RecipePlansController : ControllerBase
{
    private readonly IRecipePlanService _service;

    public RecipePlansController(IRecipePlanService service)
    {
        _service = service;
    }

    [HttpGet]
    [HasPermission("recipe-plans:view")]
    public async Task<ActionResult<ApiResponse<List<RecipePlanListDto>>>> GetAll(
        [FromQuery] bool? activeOnly = null, CancellationToken cancellationToken = default)
    {
        var plans = await _service.GetAllAsync(activeOnly, cancellationToken);
        return Ok(ApiResponse<List<RecipePlanListDto>>.SuccessResponse(plans));
    }

    [HttpGet("{id}")]
    [HasPermission("recipe-plans:view")]
    public async Task<ActionResult<ApiResponse<RecipePlanDetailDto>>> GetById(
        Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _service.GetByIdAsync(id, cancellationToken);
        if (plan == null)
            return NotFound(ApiResponse<RecipePlanDetailDto>.FailureResponse(Error.NotFound("RecipePlan", id.ToString())));
        return Ok(ApiResponse<RecipePlanDetailDto>.SuccessResponse(plan));
    }

    [HttpPost]
    [HasPermission("recipe-plans:create")]
    public async Task<ActionResult<ApiResponse<RecipePlanDetailDto>>> Create(
        [FromBody] CreateRecipePlanDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var plan = await _service.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = plan.Id },
                ApiResponse<RecipePlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RecipePlanDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id}")]
    [HasPermission("recipe-plans:edit")]
    public async Task<ActionResult<ApiResponse<RecipePlanDetailDto>>> Update(
        Guid id, [FromBody] UpdateRecipePlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _service.UpdateAsync(id, dto, cancellationToken);
        if (plan == null)
            return NotFound(ApiResponse<RecipePlanDetailDto>.FailureResponse(Error.NotFound("RecipePlan", id.ToString())));
        return Ok(ApiResponse<RecipePlanDetailDto>.SuccessResponse(plan));
    }

    [HttpDelete("{id}")]
    [HasPermission("recipe-plans:delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _service.DeleteAsync(id, cancellationToken);
        if (!result)
            return NotFound(ApiResponse<bool>.FailureResponse(Error.NotFound("RecipePlan", id.ToString())));
        return Ok(ApiResponse<bool>.SuccessResponse(true));
    }

    [HttpPost("{id}/items")]
    [HasPermission("recipe-plans:edit")]
    public async Task<ActionResult<ApiResponse<RecipePlanDetailDto>>> AddItem(
        Guid id, [FromBody] CreateRecipePlanItemDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var plan = await _service.AddItemAsync(id, dto, cancellationToken);
            if (plan == null)
                return NotFound(ApiResponse<RecipePlanDetailDto>.FailureResponse(Error.NotFound("RecipePlan", id.ToString())));
            return Ok(ApiResponse<RecipePlanDetailDto>.SuccessResponse(plan));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RecipePlanDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id}/items/{itemId}")]
    [HasPermission("recipe-plans:edit")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveItem(
        Guid id, Guid itemId, CancellationToken cancellationToken = default)
    {
        var result = await _service.RemoveItemAsync(id, itemId, cancellationToken);
        if (!result)
            return NotFound(ApiResponse<bool>.FailureResponse(Error.NotFound("RecipePlanItem", itemId.ToString())));
        return Ok(ApiResponse<bool>.SuccessResponse(true));
    }
}
