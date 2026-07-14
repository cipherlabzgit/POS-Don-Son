using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Recipes;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class RecipeService : IRecipeService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public RecipeService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<RecipeListDto> recipes, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        Guid? productId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Recipes
            .Include(r => r.Product)
            .Include(r => r.Template)
            .Include(r => r.RecipeComponents)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(r => r.IsActive);
        }

        if (productId.HasValue)
        {
            query = query.Where(r => r.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(r =>
                r.Product.Code.Contains(searchTerm) ||
                r.Product.Name.Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var recipes = await query
            .OrderByDescending(r => r.EffectiveFrom)
            .ThenBy(r => r.Product.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var recipeDtos = _mapper.Map<List<RecipeListDto>>(recipes);

        return (recipeDtos, totalCount);
    }

    public async Task<RecipeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Product)
            .Include(r => r.Template)
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.ProductionSection)
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.RecipeIngredients)
                    .ThenInclude(ri => ri.Ingredient)
                        .ThenInclude(i => i.UnitOfMeasure)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe == null)
        {
            return null;
        }

        return _mapper.Map<RecipeDetailDto>(recipe);
    }

    public async Task<RecipeDetailDto?> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Product)
            .Include(r => r.Template)
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.ProductionSection)
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.RecipeIngredients)
                    .ThenInclude(ri => ri.Ingredient)
                        .ThenInclude(i => i.UnitOfMeasure)
            .Where(r => r.ProductId == productId && r.IsActive)
            .OrderByDescending(r => r.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);

        if (recipe == null)
        {
            return null;
        }

        return _mapper.Map<RecipeDetailDto>(recipe);
    }

    public async Task<RecipeDetailDto> CreateAsync(
        RecipeCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FindAsync(new object[] { dto.ProductId }, cancellationToken);
        if (product == null)
        {
            throw new InvalidOperationException($"Product with ID {dto.ProductId} not found.");
        }

        if (dto.TemplateId.HasValue)
        {
            var template = await _context.RecipeTemplates.FindAsync(new object[] { dto.TemplateId.Value }, cancellationToken);
            if (template == null)
            {
                throw new InvalidOperationException($"Recipe template with ID {dto.TemplateId} not found.");
            }
        }

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            RecipeName = dto.RecipeName,
            Variant = dto.Variant,
            TemplateId = dto.TemplateId,
            Version = dto.Version,
            EffectiveFrom = dto.EffectiveFrom,
            EffectiveTo = dto.EffectiveTo,
            ApplyRoundOff = dto.ApplyRoundOff,
            RoundOffValue = dto.RoundOffValue,
            RoundOffNotes = dto.RoundOffNotes,
            IsActive = dto.IsActive,
            CreatedById = userId,
            UpdatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var componentDto in dto.RecipeComponents)
        {
            var component = new RecipeComponent
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                ProductionSectionId = componentDto.ProductionSectionId,
                ComponentName = componentDto.ComponentName,
                SortOrder = componentDto.SortOrder,
                IsPercentageBased = componentDto.IsPercentageBased,
                BaseRecipeId = componentDto.BaseRecipeId,
                PercentageOfBase = componentDto.PercentageOfBase,
                IsActive = true,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var ingredientDto in componentDto.RecipeIngredients)
            {
                var ingredient = new RecipeIngredient
                {
                    Id = Guid.NewGuid(),
                    RecipeComponentId = component.Id,
                    IngredientId = ingredientDto.IngredientId,
                    QtyPerUnit = ingredientDto.QtyPerUnit,
                    ExtraQtyPerUnit = ingredientDto.ExtraQtyPerUnit,
                    StoresOnly = ingredientDto.StoresOnly,
                    ShowExtraInStores = ingredientDto.ShowExtraInStores,
                    IsPercentage = ingredientDto.IsPercentage,
                    PercentageSourceProductId = ingredientDto.PercentageSourceProductId,
                    PercentageValue = ingredientDto.PercentageValue,
                    SortOrder = ingredientDto.SortOrder,
                    IsActive = true,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                component.RecipeIngredients.Add(ingredient);
            }

            recipe.RecipeComponents.Add(component);
        }

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeService", $"Recipe created for product: {product.Code} by user {userId}");

        return (await GetByIdAsync(recipe.Id, cancellationToken))!;
    }

    public async Task<RecipeDetailDto> UpdateAsync(
        Guid id,
        RecipeUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.RecipeIngredients)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe == null)
        {
            throw new InvalidOperationException($"Recipe with ID {id} not found.");
        }

        var product = await _context.Products.FindAsync(new object[] { dto.ProductId }, cancellationToken);
        if (product == null)
        {
            throw new InvalidOperationException($"Product with ID {dto.ProductId} not found.");
        }

        if (dto.TemplateId.HasValue)
        {
            var template = await _context.RecipeTemplates.FindAsync(new object[] { dto.TemplateId.Value }, cancellationToken);
            if (template == null)
            {
                throw new InvalidOperationException($"Recipe template with ID {dto.TemplateId} not found.");
            }
        }

        // Delete old children via raw SQL to avoid EF change-tracker conflicts
        // caused by HasDefaultValueSql("NOW()") on UpdatedAt marking columns as
        // database-generated, which confuses the UPDATE concurrency check.
        await _context.Database.ExecuteSqlRawAsync(
            @"DELETE FROM recipe_ingredients
              WHERE recipe_component_id IN (
                  SELECT id FROM recipe_components WHERE recipe_id = {0}
              )", id, cancellationToken);

        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM recipe_components WHERE recipe_id = {0}", id, cancellationToken);

        // Detach stale child entities so EF doesn't try to process them again
        foreach (var comp in recipe.RecipeComponents.ToList())
        {
            foreach (var ing in comp.RecipeIngredients.ToList())
                _context.Entry(ing).State = EntityState.Detached;
            _context.Entry(comp).State = EntityState.Detached;
        }
        recipe.RecipeComponents.Clear();

        recipe.ProductId = dto.ProductId;
        recipe.RecipeName = dto.RecipeName;
        recipe.Variant = dto.Variant;
        recipe.TemplateId = dto.TemplateId;
        recipe.Version = dto.Version;
        recipe.EffectiveFrom = dto.EffectiveFrom;
        recipe.EffectiveTo = dto.EffectiveTo;
        recipe.ApplyRoundOff = dto.ApplyRoundOff;
        recipe.RoundOffValue = dto.RoundOffValue;
        recipe.RoundOffNotes = dto.RoundOffNotes;
        recipe.IsActive = dto.IsActive;
        recipe.UpdatedById = userId;
        recipe.UpdatedAt = DateTime.UtcNow;

        foreach (var componentDto in dto.RecipeComponents)
        {
            var component = new RecipeComponent
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                ProductionSectionId = componentDto.ProductionSectionId,
                ComponentName = componentDto.ComponentName,
                SortOrder = componentDto.SortOrder,
                IsPercentageBased = componentDto.IsPercentageBased,
                BaseRecipeId = componentDto.BaseRecipeId,
                PercentageOfBase = componentDto.PercentageOfBase,
                IsActive = true,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var ingredientDto in componentDto.RecipeIngredients)
            {
                var ingredient = new RecipeIngredient
                {
                    Id = Guid.NewGuid(),
                    RecipeComponentId = component.Id,
                    IngredientId = ingredientDto.IngredientId,
                    QtyPerUnit = ingredientDto.QtyPerUnit,
                    ExtraQtyPerUnit = ingredientDto.ExtraQtyPerUnit,
                    StoresOnly = ingredientDto.StoresOnly,
                    ShowExtraInStores = ingredientDto.ShowExtraInStores,
                    IsPercentage = ingredientDto.IsPercentage,
                    PercentageSourceProductId = ingredientDto.PercentageSourceProductId,
                    PercentageValue = ingredientDto.PercentageValue,
                    SortOrder = ingredientDto.SortOrder,
                    IsActive = true,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                component.RecipeIngredients.Add(ingredient);
            }

            recipe.RecipeComponents.Add(component);
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeService", $"Recipe updated for product: {product.Code} by user {userId}");

        return (await GetByIdAsync(recipe.Id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe == null)
        {
            throw new InvalidOperationException($"Recipe with ID {id} not found.");
        }

        recipe.IsActive = false;
        recipe.UpdatedById = userId;
        recipe.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeService", $"Recipe soft-deleted for product: {recipe.Product.Code} by user {userId}");
    }

    public async Task<RecipeCalculationDto> CalculateIngredientsAsync(
        Guid productId,
        decimal quantity,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Product)
            .Include(r => r.RecipeComponents)
                .ThenInclude(rc => rc.RecipeIngredients)
                    .ThenInclude(ri => ri.Ingredient)
                        .ThenInclude(i => i.UnitOfMeasure)
            .Where(r => r.ProductId == productId && r.IsActive)
            .OrderByDescending(r => r.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);

        if (recipe == null)
        {
            throw new InvalidOperationException($"No active recipe found for product ID {productId}.");
        }

        var calculatedIngredients = new List<CalculatedIngredientDto>();

        foreach (var component in recipe.RecipeComponents.OrderBy(c => c.SortOrder))
        {
            foreach (var recipeIngredient in component.RecipeIngredients.OrderBy(ri => ri.SortOrder))
            {
                var requiredQty = recipeIngredient.QtyPerUnit * quantity;
                var extraQty = recipeIngredient.ExtraQtyPerUnit * quantity;
                var totalQty = requiredQty + extraQty;

                if (recipe.ApplyRoundOff && recipe.RoundOffValue.HasValue)
                {
                    totalQty = Math.Ceiling(totalQty / recipe.RoundOffValue.Value) * recipe.RoundOffValue.Value;
                }

                calculatedIngredients.Add(new CalculatedIngredientDto
                {
                    IngredientId = recipeIngredient.IngredientId,
                    IngredientCode = recipeIngredient.Ingredient.Code,
                    IngredientName = recipeIngredient.Ingredient.Name,
                    ComponentName = component.ComponentName,
                    RequiredQuantity = requiredQty,
                    ExtraQuantity = extraQty,
                    TotalQuantity = totalQty,
                    Unit = recipeIngredient.Ingredient.UnitOfMeasure?.Code ?? "",
                    StoresOnly = recipeIngredient.StoresOnly,
                    ShowExtraInStores = recipeIngredient.ShowExtraInStores
                });
            }
        }

        return new RecipeCalculationDto
        {
            ProductId = recipe.ProductId,
            ProductCode = recipe.Product.Code,
            ProductName = recipe.Product.Name,
            Quantity = quantity,
            Ingredients = calculatedIngredients
        };
    }
}
