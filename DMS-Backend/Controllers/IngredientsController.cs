using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Ingredients;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IngredientsController : ControllerBase
{
    private readonly IIngredientService _ingredientService;

    public IngredientsController(IIngredientService ingredientService)
    {
        _ingredientService = ingredientService;
    }

    [HttpGet]
    [HasPermission("ingredients:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? ingredientType = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (ingredients, totalCount) = await _ingredientService.GetAllAsync(page, pageSize, search, categoryId, ingredientType, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Ingredients = ingredients,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("ingredients:view")]
    public async Task<ActionResult<ApiResponse<IngredientDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var ingredient = await _ingredientService.GetByIdAsync(id, cancellationToken);
        if (ingredient == null)
        {
            return NotFound(ApiResponse<IngredientDetailDto>.FailureResponse(Error.NotFound("Ingredient", id.ToString())));
        }

        return Ok(ApiResponse<IngredientDetailDto>.SuccessResponse(ingredient));
    }

    [HttpPost]
    [HasPermission("ingredients:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<IngredientDetailDto>>> Create(
        [FromBody] CreateIngredientDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ingredient = await _ingredientService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = ingredient.Id },
                ApiResponse<IngredientDetailDto>.SuccessResponse(ingredient));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<IngredientDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("ingredients:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<IngredientDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateIngredientDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ingredient = await _ingredientService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<IngredientDetailDto>.SuccessResponse(ingredient));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<IngredientDetailDto>.FailureResponse(Error.NotFound("Ingredient", id.ToString())));
            }
            return Conflict(ApiResponse<IngredientDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("ingredients:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _ingredientService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Ingredient deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Ingredient", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
