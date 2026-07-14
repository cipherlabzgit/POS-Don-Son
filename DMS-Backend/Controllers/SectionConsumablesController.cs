using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.SectionConsumables;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/section-consumables")]
public class SectionConsumablesController : ControllerBase
{
    private readonly ISectionConsumableService _sectionConsumableService;

    public SectionConsumablesController(ISectionConsumableService sectionConsumableService)
    {
        _sectionConsumableService = sectionConsumableService;
    }

    [HttpGet]
    [HasPermission("section-consumables:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? productionSectionId = null,
        [FromQuery] Guid? ingredientId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (sectionConsumables, totalCount) = await _sectionConsumableService.GetAllAsync(
            page, pageSize, productionSectionId, ingredientId, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            SectionConsumables = sectionConsumables,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("section-consumables:view")]
    public async Task<ActionResult<ApiResponse<SectionConsumableDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var sectionConsumable = await _sectionConsumableService.GetByIdAsync(id, cancellationToken);
        if (sectionConsumable == null)
        {
            return NotFound(ApiResponse<SectionConsumableDetailDto>.FailureResponse(
                Error.NotFound("SectionConsumable", id.ToString())));
        }

        return Ok(ApiResponse<SectionConsumableDetailDto>.SuccessResponse(sectionConsumable));
    }

    [HttpPost]
    [HasPermission("section-consumables:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SectionConsumableDetailDto>>> Create(
        [FromBody] CreateSectionConsumableDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sectionConsumable = await _sectionConsumableService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = sectionConsumable.Id },
                ApiResponse<SectionConsumableDetailDto>.SuccessResponse(sectionConsumable));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<SectionConsumableDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("section-consumables:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<SectionConsumableDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateSectionConsumableDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sectionConsumable = await _sectionConsumableService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<SectionConsumableDetailDto>.SuccessResponse(sectionConsumable));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<SectionConsumableDetailDto>.FailureResponse(
                    Error.NotFound("SectionConsumable", id.ToString())));
            }

            return Conflict(ApiResponse<SectionConsumableDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("section-consumables:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _sectionConsumableService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Section consumable deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("SectionConsumable", id.ToString())));
        }
    }
}
