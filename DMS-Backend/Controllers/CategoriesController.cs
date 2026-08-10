using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Categories;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [HasPermission("categories:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        [FromQuery] bool? displayInPosOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (categories, totalCount) = await _categoryService.GetAllAsync(page, pageSize, search, activeOnly, displayInPosOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Categories = categories,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("categories:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<CategoryDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryService.GetByIdAsync(id, cancellationToken);
        if (category == null)
        {
            return NotFound(ApiResponse<CategoryDetailDto>.FailureResponse(Error.NotFound("Category", id.ToString())));
        }

        return Ok(ApiResponse<CategoryDetailDto>.SuccessResponse(category));
    }

    [HttpPost]
    [HasPermission("categories:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<CategoryDetailDto>>> Create(
        [FromBody] CreateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var category = await _categoryService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = category.Id },
                ApiResponse<CategoryDetailDto>.SuccessResponse(category));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<CategoryDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("categories:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<CategoryDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var category = await _categoryService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<CategoryDetailDto>.SuccessResponse(category));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<CategoryDetailDto>.FailureResponse(Error.NotFound("Category", id.ToString())));
            }
            return Conflict(ApiResponse<CategoryDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("categories:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _categoryService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Category deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Category", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
