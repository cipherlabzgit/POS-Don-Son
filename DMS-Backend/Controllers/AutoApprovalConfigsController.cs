using DMS_Backend.Common;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AutoApprovalConfigsController : ControllerBase
{
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public AutoApprovalConfigsController(IAutoApprovalConfigService autoApprovalConfigService)
    {
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    [HttpGet]
    [HasPermission("auto-approval-config:view")]
    public async Task<ActionResult<ApiResponse<List<AutoApprovalConfig>>>> GetAll(
        CancellationToken cancellationToken = default)
    {
        var configs = await _autoApprovalConfigService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<List<AutoApprovalConfig>>.SuccessResponse(configs));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("auto-approval-config:view")]
    public async Task<ActionResult<ApiResponse<AutoApprovalConfig>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var config = await _autoApprovalConfigService.GetByIdAsync(id, cancellationToken);
        if (config == null)
        {
            return NotFound(ApiResponse<AutoApprovalConfig>.FailureResponse(Error.NotFound("AutoApprovalConfig", id.ToString())));
        }

        return Ok(ApiResponse<AutoApprovalConfig>.SuccessResponse(config));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("auto-approval-config:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<AutoApprovalConfig>>> Update(
        Guid id,
        [FromBody] UpdateAutoApprovalConfigRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var config = await _autoApprovalConfigService.UpdateAsync(id, request.IsEnabled, userId, cancellationToken);

            return Ok(ApiResponse<AutoApprovalConfig>.SuccessResponse(config));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<AutoApprovalConfig>.FailureResponse(Error.NotFound("AutoApprovalConfig", id.ToString())));
        }
    }
}

public record UpdateAutoApprovalConfigRequest(bool IsEnabled);
