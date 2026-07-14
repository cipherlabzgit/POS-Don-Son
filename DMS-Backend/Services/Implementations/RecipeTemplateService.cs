using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.RecipeTemplates;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class RecipeTemplateService : IRecipeTemplateService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public RecipeTemplateService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<RecipeTemplateListDto> templates, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RecipeTemplates
            .Include(rt => rt.Category)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(rt => rt.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(rt =>
                rt.Code.Contains(searchTerm) ||
                rt.Name.Contains(searchTerm) ||
                (rt.Description != null && rt.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var templates = await query
            .OrderBy(rt => rt.SortOrder)
            .ThenBy(rt => rt.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var templateDtos = _mapper.Map<List<RecipeTemplateListDto>>(templates);

        return (templateDtos, totalCount);
    }

    public async Task<RecipeTemplateDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _context.RecipeTemplates
            .Include(rt => rt.Category)
            .Include(rt => rt.RecipeTemplateComponents)
                .ThenInclude(rtc => rtc.RecipeTemplateIngredients)
                    .ThenInclude(rti => rti.Ingredient)
                        .ThenInclude(i => i!.UnitOfMeasure)
            .Include(rt => rt.RecipeTemplateComponents)
                .ThenInclude(rtc => rtc.ProductionSection)
            .FirstOrDefaultAsync(rt => rt.Id == id, cancellationToken);

        if (template == null)
        {
            return null;
        }

        return _mapper.Map<RecipeTemplateDetailDto>(template);
    }

    public async Task<RecipeTemplateDetailDto> CreateAsync(
        RecipeTemplateCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Recipe template with code '{dto.Code}' already exists.");
        }

        var template = _mapper.Map<RecipeTemplate>(dto);
        template.Id = Guid.NewGuid();
        template.CreatedById = userId;
        template.UpdatedById = userId;
        template.CreatedAt = DateTime.UtcNow;
        template.UpdatedAt = DateTime.UtcNow;

        _context.RecipeTemplates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeTemplateService", $"Recipe template created: {template.Code} by user {userId}");

        return _mapper.Map<RecipeTemplateDetailDto>(template);
    }

    public async Task<RecipeTemplateDetailDto> UpdateAsync(
        Guid id,
        RecipeTemplateUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.RecipeTemplates
            .FirstOrDefaultAsync(rt => rt.Id == id, cancellationToken);

        if (template == null)
        {
            throw new InvalidOperationException($"Recipe template with ID {id} not found.");
        }

        if (await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Recipe template with code '{dto.Code}' already exists.");
        }

        _mapper.Map(dto, template);
        template.UpdatedById = userId;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeTemplateService", $"Recipe template updated: {template.Code} by user {userId}");

        return _mapper.Map<RecipeTemplateDetailDto>(template);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var template = await _context.RecipeTemplates
            .FirstOrDefaultAsync(rt => rt.Id == id, cancellationToken);

        if (template == null)
        {
            throw new InvalidOperationException($"Recipe template with ID {id} not found.");
        }

        template.IsActive = false;
        template.UpdatedById = userId;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("RecipeTemplateService", $"Recipe template soft-deleted: {template.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.RecipeTemplates.Where(rt => rt.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(rt => rt.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<RecipeTemplateComponentDto> AddComponentAsync(CreateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default)
    {
        var component = new RecipeTemplateComponent
        {
            Id = Guid.NewGuid(),
            RecipeTemplateId = dto.RecipeTemplateId,
            ProductionSectionId = dto.ProductionSectionId,
            ComponentName = dto.ComponentName,
            SortOrder = dto.SortOrder
        };

        foreach (var ingDto in dto.Ingredients)
        {
            component.RecipeTemplateIngredients.Add(new RecipeTemplateIngredient
            {
                Id = Guid.NewGuid(),
                RecipeTemplateComponentId = component.Id,
                IngredientId = ingDto.IngredientId,
                QtyPerUnit = ingDto.QtyPerUnit,
                ExtraQtyPerUnit = ingDto.ExtraQtyPerUnit,
                StoresOnly = ingDto.StoresOnly,
                ShowExtraInStores = ingDto.ShowExtraInStores,
                SortOrder = ingDto.SortOrder
            });
        }

        _context.RecipeTemplateComponents.Add(component);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetComponentDtoAsync(component.Id, cancellationToken);
    }

    public async Task<RecipeTemplateComponentDto?> UpdateComponentAsync(Guid componentId, UpdateRecipeTemplateComponentDto dto, CancellationToken cancellationToken = default)
    {
        var component = await _context.RecipeTemplateComponents
            .FirstOrDefaultAsync(c => c.Id == componentId, cancellationToken);

        if (component == null) return null;

        if (dto.ComponentName != null) component.ComponentName = dto.ComponentName;
        if (dto.ProductionSectionId.HasValue) component.ProductionSectionId = dto.ProductionSectionId.Value;
        if (dto.SortOrder.HasValue) component.SortOrder = dto.SortOrder.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetComponentDtoAsync(componentId, cancellationToken);
    }

    public async Task<bool> DeleteComponentAsync(Guid componentId, CancellationToken cancellationToken = default)
    {
        var component = await _context.RecipeTemplateComponents
            .FirstOrDefaultAsync(c => c.Id == componentId, cancellationToken);

        if (component == null) return false;

        component.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<RecipeTemplateIngredientDto> AddIngredientAsync(Guid componentId, CreateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default)
    {
        var ingredient = new RecipeTemplateIngredient
        {
            Id = Guid.NewGuid(),
            RecipeTemplateComponentId = componentId,
            IngredientId = dto.IngredientId,
            QtyPerUnit = dto.QtyPerUnit,
            ExtraQtyPerUnit = dto.ExtraQtyPerUnit,
            StoresOnly = dto.StoresOnly,
            ShowExtraInStores = dto.ShowExtraInStores,
            SortOrder = dto.SortOrder
        };

        _context.RecipeTemplateIngredients.Add(ingredient);
        await _context.SaveChangesAsync(cancellationToken);

        var loaded = await _context.RecipeTemplateIngredients
            .Include(rti => rti.Ingredient)
                .ThenInclude(i => i!.UnitOfMeasure)
            .FirstOrDefaultAsync(rti => rti.Id == ingredient.Id, cancellationToken);

        return ToIngredientDto(loaded!);
    }

    public async Task<RecipeTemplateIngredientDto?> UpdateIngredientAsync(Guid ingredientId, UpdateRecipeTemplateIngredientDto dto, CancellationToken cancellationToken = default)
    {
        var ingredient = await _context.RecipeTemplateIngredients
            .Include(rti => rti.Ingredient)
                .ThenInclude(i => i!.UnitOfMeasure)
            .FirstOrDefaultAsync(rti => rti.Id == ingredientId, cancellationToken);

        if (ingredient == null) return null;

        if (dto.QtyPerUnit.HasValue) ingredient.QtyPerUnit = dto.QtyPerUnit.Value;
        if (dto.ExtraQtyPerUnit.HasValue) ingredient.ExtraQtyPerUnit = dto.ExtraQtyPerUnit.Value;
        if (dto.StoresOnly.HasValue) ingredient.StoresOnly = dto.StoresOnly.Value;
        if (dto.ShowExtraInStores.HasValue) ingredient.ShowExtraInStores = dto.ShowExtraInStores.Value;
        if (dto.SortOrder.HasValue) ingredient.SortOrder = dto.SortOrder.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return ToIngredientDto(ingredient);
    }

    public async Task<bool> DeleteIngredientAsync(Guid ingredientId, CancellationToken cancellationToken = default)
    {
        var ingredient = await _context.RecipeTemplateIngredients
            .FirstOrDefaultAsync(rti => rti.Id == ingredientId, cancellationToken);

        if (ingredient == null) return false;

        ingredient.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> LoadFromTemplateAsync(LoadFromTemplateDto dto, CancellationToken cancellationToken = default)
    {
        var template = await _context.RecipeTemplates
            .Include(rt => rt.RecipeTemplateComponents)
                .ThenInclude(rtc => rtc.RecipeTemplateIngredients)
            .FirstOrDefaultAsync(rt => rt.Id == dto.RecipeTemplateId, cancellationToken);

        if (template == null)
            throw new InvalidOperationException("Recipe template not found");

        var recipe = await _context.Recipes
            .Include(r => r.RecipeComponents)
            .FirstOrDefaultAsync(r => r.Id == dto.RecipeId, cancellationToken);

        if (recipe == null)
            throw new InvalidOperationException("Recipe not found");

        if (dto.ReplaceExisting)
        {
            foreach (var existing in recipe.RecipeComponents)
                existing.IsActive = false;
        }

        int added = 0;
        foreach (var templateComponent in template.RecipeTemplateComponents)
        {
            var newComponent = new RecipeComponent
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                ProductionSectionId = templateComponent.ProductionSectionId,
                ComponentName = templateComponent.ComponentName,
                SortOrder = templateComponent.SortOrder,
                IsPercentageBased = false
            };

            foreach (var templateIngredient in templateComponent.RecipeTemplateIngredients)
            {
                newComponent.RecipeIngredients.Add(new RecipeIngredient
                {
                    Id = Guid.NewGuid(),
                    RecipeComponentId = newComponent.Id,
                    IngredientId = templateIngredient.IngredientId,
                    QtyPerUnit = templateIngredient.QtyPerUnit,
                    ExtraQtyPerUnit = templateIngredient.ExtraQtyPerUnit,
                    StoresOnly = templateIngredient.StoresOnly,
                    ShowExtraInStores = templateIngredient.ShowExtraInStores,
                    SortOrder = templateIngredient.SortOrder
                });
            }

            _context.RecipeComponents.Add(newComponent);
            added++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<RecipeTemplateComponentDto> GetComponentDtoAsync(Guid componentId, CancellationToken cancellationToken)
    {
        var component = await _context.RecipeTemplateComponents
            .Include(c => c.ProductionSection)
            .Include(c => c.RecipeTemplateIngredients)
                .ThenInclude(rti => rti.Ingredient)
                    .ThenInclude(i => i!.UnitOfMeasure)
            .FirstOrDefaultAsync(c => c.Id == componentId, cancellationToken);

        return ToComponentDto(component!);
    }

    private static RecipeTemplateComponentDto ToComponentDto(RecipeTemplateComponent c) => new()
    {
        Id = c.Id,
        RecipeTemplateId = c.RecipeTemplateId,
        ProductionSectionId = c.ProductionSectionId,
        ProductionSectionName = c.ProductionSection?.Name ?? string.Empty,
        ComponentName = c.ComponentName,
        SortOrder = c.SortOrder,
        Ingredients = c.RecipeTemplateIngredients.Select(ToIngredientDto).ToList()
    };

    private static RecipeTemplateIngredientDto ToIngredientDto(RecipeTemplateIngredient rti) => new()
    {
        Id = rti.Id,
        RecipeTemplateComponentId = rti.RecipeTemplateComponentId,
        IngredientId = rti.IngredientId,
        IngredientCode = rti.Ingredient?.Code ?? string.Empty,
        IngredientName = rti.Ingredient?.Name ?? string.Empty,
        Unit = rti.Ingredient?.UnitOfMeasure?.Code ?? string.Empty,
        QtyPerUnit = rti.QtyPerUnit,
        ExtraQtyPerUnit = rti.ExtraQtyPerUnit,
        StoresOnly = rti.StoresOnly,
        ShowExtraInStores = rti.ShowExtraInStores,
        SortOrder = rti.SortOrder
    };
}
