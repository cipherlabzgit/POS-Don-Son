using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Recipes;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly IRecipeService _recipeService;

    public RecipesController(IRecipeService recipeService)
    {
        _recipeService = recipeService;
    }

    [HttpGet]
    [HasPermission("recipes:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        [FromQuery] Guid? productId = null,
        CancellationToken cancellationToken = default)
    {
        var (recipes, totalCount) = await _recipeService.GetAllAsync(page, pageSize, search, activeOnly, productId, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Recipes = recipes,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("recipes:view")]
    public async Task<ActionResult<ApiResponse<RecipeDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _recipeService.GetByIdAsync(id, cancellationToken);
        if (recipe == null)
        {
            return NotFound(ApiResponse<RecipeDetailDto>.FailureResponse(Error.NotFound("Recipe", id.ToString())));
        }

        return Ok(ApiResponse<RecipeDetailDto>.SuccessResponse(recipe));
    }

    [HttpGet("by-product/{productId:guid}")]
    [HasPermission("recipes:view")]
    public async Task<ActionResult<ApiResponse<RecipeDetailDto>>> GetByProductId(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _recipeService.GetByProductIdAsync(productId, cancellationToken);
        if (recipe == null)
        {
            return NotFound(ApiResponse<RecipeDetailDto>.FailureResponse(Error.NotFound("Recipe", $"for product {productId}")));
        }

        return Ok(ApiResponse<RecipeDetailDto>.SuccessResponse(recipe));
    }

    [HttpPost("{productId:guid}/calculate")]
    [HasPermission("recipes:view")]
    public async Task<ActionResult<ApiResponse<RecipeCalculationDto>>> CalculateIngredients(
        Guid productId,
        [FromQuery] decimal qty,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var calculation = await _recipeService.CalculateIngredientsAsync(productId, qty, cancellationToken);
            return Ok(ApiResponse<RecipeCalculationDto>.SuccessResponse(calculation));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<RecipeCalculationDto>.FailureResponse(Error.NotFound("Recipe", ex.Message)));
        }
    }

    [HttpPost]
    [HasPermission("recipes:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeDetailDto>>> Create(
        [FromBody] RecipeCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var recipe = await _recipeService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = recipe.Id },
                ApiResponse<RecipeDetailDto>.SuccessResponse(recipe));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<RecipeDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("recipes:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeDetailDto>>> Update(
        Guid id,
        [FromBody] RecipeUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var recipe = await _recipeService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<RecipeDetailDto>.SuccessResponse(recipe));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<RecipeDetailDto>.FailureResponse(Error.NotFound("Recipe", id.ToString())));
            }
            return Conflict(ApiResponse<RecipeDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("recipes:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _recipeService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Recipe deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Recipe", id.ToString())));
        }
    }
}
