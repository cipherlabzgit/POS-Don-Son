using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ProductionSections;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/production-sections")]
public class ProductionSectionsController : ControllerBase
{
    private readonly IProductionSectionService _productionSectionService;

    public ProductionSectionsController(IProductionSectionService productionSectionService)
    {
        _productionSectionService = productionSectionService;
    }

    [HttpGet]
    [HasPermission("production:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (productionSections, totalCount) = await _productionSectionService.GetAllAsync(
            page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            ProductionSections = productionSections,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production:view")]
    public async Task<ActionResult<ApiResponse<ProductionSectionDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var productionSection = await _productionSectionService.GetByIdAsync(id, cancellationToken);
        if (productionSection == null)
        {
            return NotFound(ApiResponse<ProductionSectionDetailDto>.FailureResponse(
                Error.NotFound("ProductionSection", id.ToString())));
        }

        return Ok(ApiResponse<ProductionSectionDetailDto>.SuccessResponse(productionSection));
    }

    [HttpPost]
    [HasPermission("production:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionSectionDetailDto>>> Create(
        [FromBody] CreateProductionSectionDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var productionSection = await _productionSectionService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = productionSection.Id },
                ApiResponse<ProductionSectionDetailDto>.SuccessResponse(productionSection));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ProductionSectionDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionSectionDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateProductionSectionDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var productionSection = await _productionSectionService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<ProductionSectionDetailDto>.SuccessResponse(productionSection));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ProductionSectionDetailDto>.FailureResponse(
                    Error.NotFound("ProductionSection", id.ToString())));
            }

            return Conflict(ApiResponse<ProductionSectionDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _productionSectionService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Production section deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("ProductionSection", id.ToString())));
        }
    }
}
