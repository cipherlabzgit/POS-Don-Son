using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.RecipeTemplates;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RecipeTemplatesController : ControllerBase
{
    private readonly IRecipeTemplateService _recipeTemplateService;

    public RecipeTemplatesController(IRecipeTemplateService recipeTemplateService)
    {
        _recipeTemplateService = recipeTemplateService;
    }

    [HttpGet]
    [HasPermission("recipe-templates:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (templates, totalCount) = await _recipeTemplateService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            RecipeTemplates = templates,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("recipe-templates:view")]
    public async Task<ActionResult<ApiResponse<RecipeTemplateDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var template = await _recipeTemplateService.GetByIdAsync(id, cancellationToken);
        if (template == null)
        {
            return NotFound(ApiResponse<RecipeTemplateDetailDto>.FailureResponse(Error.NotFound("RecipeTemplate", id.ToString())));
        }

        return Ok(ApiResponse<RecipeTemplateDetailDto>.SuccessResponse(template));
    }

    [HttpPost]
    [HasPermission("recipe-templates:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateDetailDto>>> Create(
        [FromBody] RecipeTemplateCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var template = await _recipeTemplateService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = template.Id },
                ApiResponse<RecipeTemplateDetailDto>.SuccessResponse(template));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<RecipeTemplateDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateDetailDto>>> Update(
        Guid id,
        [FromBody] RecipeTemplateUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var template = await _recipeTemplateService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<RecipeTemplateDetailDto>.SuccessResponse(template));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<RecipeTemplateDetailDto>.FailureResponse(Error.NotFound("RecipeTemplate", id.ToString())));
            }
            return Conflict(ApiResponse<RecipeTemplateDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("recipe-templates:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _recipeTemplateService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Recipe template deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("RecipeTemplate", id.ToString())));
        }
    }

    // Component endpoints
    [HttpPost("components")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateComponentDto>>> AddComponent(
        [FromBody] CreateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default)
    {
        var component = await _recipeTemplateService.AddComponentAsync(dto, cancellationToken);
        return Ok(ApiResponse<RecipeTemplateComponentDto>.SuccessResponse(component));
    }

    [HttpPut("components/{componentId:guid}")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateComponentDto>>> UpdateComponent(
        Guid componentId, [FromBody] UpdateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default)
    {
        var component = await _recipeTemplateService.UpdateComponentAsync(componentId, dto, cancellationToken);
        if (component == null)
            return NotFound(ApiResponse<RecipeTemplateComponentDto>.FailureResponse(Error.NotFound("RecipeTemplateComponent", componentId.ToString())));
        return Ok(ApiResponse<RecipeTemplateComponentDto>.SuccessResponse(component));
    }

    [HttpDelete("components/{componentId:guid}")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> DeleteComponent(
        Guid componentId, CancellationToken cancellationToken = default)
    {
        var result = await _recipeTemplateService.DeleteComponentAsync(componentId, cancellationToken);
        if (!result)
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("RecipeTemplateComponent", componentId.ToString())));
        return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Component deleted" }));
    }

    [HttpPost("components/{componentId:guid}/ingredients")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateIngredientDto>>> AddIngredient(
        Guid componentId, [FromBody] CreateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default)
    {
        var ingredient = await _recipeTemplateService.AddIngredientAsync(componentId, dto, cancellationToken);
        return Ok(ApiResponse<RecipeTemplateIngredientDto>.SuccessResponse(ingredient));
    }

    [HttpPut("ingredients/{ingredientId:guid}")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<RecipeTemplateIngredientDto>>> UpdateIngredient(
        Guid ingredientId, [FromBody] UpdateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default)
    {
        var ingredient = await _recipeTemplateService.UpdateIngredientAsync(ingredientId, dto, cancellationToken);
        if (ingredient == null)
            return NotFound(ApiResponse<RecipeTemplateIngredientDto>.FailureResponse(Error.NotFound("RecipeTemplateIngredient", ingredientId.ToString())));
        return Ok(ApiResponse<RecipeTemplateIngredientDto>.SuccessResponse(ingredient));
    }

    [HttpDelete("ingredients/{ingredientId:guid}")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> DeleteIngredient(
        Guid ingredientId, CancellationToken cancellationToken = default)
    {
        var result = await _recipeTemplateService.DeleteIngredientAsync(ingredientId, cancellationToken);
        if (!result)
            return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("RecipeTemplateIngredient", ingredientId.ToString())));
        return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Ingredient deleted" }));
    }

    /// <summary>
    /// Load template components+ingredients into an existing recipe (as a starting point).
    /// </summary>
    [HttpPost("load-into-recipe")]
    [HasPermission("recipe-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> LoadFromTemplate(
        [FromBody] LoadFromTemplateDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var added = await _recipeTemplateService.LoadFromTemplateAsync(dto, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { ComponentsAdded = added, Message = $"{added} component(s) loaded into recipe" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
