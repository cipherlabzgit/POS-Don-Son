using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.WorkflowConfigs;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkflowConfigsController : ControllerBase
{
    private readonly IWorkflowConfigService _workflowConfigService;

    public WorkflowConfigsController(IWorkflowConfigService workflowConfigService)
    {
        _workflowConfigService = workflowConfigService;
    }

    [HttpGet]
    [HasPermission("workflow-config:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (workflowConfigs, totalCount) = await _workflowConfigService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            WorkflowConfigs = workflowConfigs,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("workflow-config:view")]
    public async Task<ActionResult<ApiResponse<WorkflowConfigDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var workflowConfig = await _workflowConfigService.GetByIdAsync(id, cancellationToken);
        if (workflowConfig == null)
        {
            return NotFound(ApiResponse<WorkflowConfigDetailDto>.FailureResponse(Error.NotFound("WorkflowConfig", id.ToString())));
        }

        return Ok(ApiResponse<WorkflowConfigDetailDto>.SuccessResponse(workflowConfig));
    }

    [HttpPost]
    [HasPermission("workflow-config:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<WorkflowConfigDetailDto>>> Create(
        [FromBody] WorkflowConfigCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var workflowConfig = await _workflowConfigService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = workflowConfig.Id },
                ApiResponse<WorkflowConfigDetailDto>.SuccessResponse(workflowConfig));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<WorkflowConfigDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("workflow-config:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<WorkflowConfigDetailDto>>> Update(
        Guid id,
        [FromBody] WorkflowConfigUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var workflowConfig = await _workflowConfigService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<WorkflowConfigDetailDto>.SuccessResponse(workflowConfig));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<WorkflowConfigDetailDto>.FailureResponse(Error.NotFound("WorkflowConfig", id.ToString())));
            }
            return Conflict(ApiResponse<WorkflowConfigDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("workflow-config:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _workflowConfigService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Workflow config deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("WorkflowConfig", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
