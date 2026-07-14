using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.SecurityPolicies;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SecurityPoliciesController : ControllerBase
{
    private readonly ISecurityPolicyService _securityPolicyService;

    public SecurityPoliciesController(ISecurityPolicyService securityPolicyService)
    {
        _securityPolicyService = securityPolicyService;
    }

    [HttpGet]
    [HasPermission("security-policies:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (securityPolicies, totalCount) = await _securityPolicyService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            SecurityPolicies = securityPolicies,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("security-policies:view")]
    public async Task<ActionResult<ApiResponse<SecurityPolicyDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var securityPolicy = await _securityPolicyService.GetByIdAsync(id, cancellationToken);
        if (securityPolicy == null)
        {
            return NotFound(ApiResponse<SecurityPolicyDetailDto>.FailureResponse(Error.NotFound("SecurityPolicy", id.ToString())));
        }

        return Ok(ApiResponse<SecurityPolicyDetailDto>.SuccessResponse(securityPolicy));
    }

    [HttpPost]
    [HasPermission("security-policies:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SecurityPolicyDetailDto>>> Create(
        [FromBody] SecurityPolicyCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var securityPolicy = await _securityPolicyService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = securityPolicy.Id },
                ApiResponse<SecurityPolicyDetailDto>.SuccessResponse(securityPolicy));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<SecurityPolicyDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("security-policies:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SecurityPolicyDetailDto>>> Update(
        Guid id,
        [FromBody] SecurityPolicyUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var securityPolicy = await _securityPolicyService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<SecurityPolicyDetailDto>.SuccessResponse(securityPolicy));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<SecurityPolicyDetailDto>.FailureResponse(Error.NotFound("SecurityPolicy", id.ToString())));
            }
            return Conflict(ApiResponse<SecurityPolicyDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("security-policies:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _securityPolicyService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Security policy deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("SecurityPolicy", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
