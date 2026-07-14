using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Ingredients;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class IngredientService : IIngredientService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public IngredientService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<IngredientListItemDto> ingredients, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        Guid? categoryId = null,
        string? ingredientType = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Ingredients
            .Include(i => i.Category)
            .Include(i => i.UnitOfMeasure)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(i => i.IsActive);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(ingredientType))
        {
            query = query.Where(i => i.IngredientType == ingredientType);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(i =>
                i.Code.Contains(searchTerm) ||
                i.Name.Contains(searchTerm) ||
                (i.Description != null && i.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var ingredients = await query
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ingredientDtos = _mapper.Map<List<IngredientListItemDto>>(ingredients);

        return (ingredientDtos, totalCount);
    }

    public async Task<IngredientDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ingredient = await _context.Ingredients
            .Include(i => i.Category)
            .Include(i => i.UnitOfMeasure)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (ingredient == null)
        {
            return null;
        }

        return _mapper.Map<IngredientDetailDto>(ingredient);
    }

    public async Task<IngredientDetailDto> CreateAsync(
        CreateIngredientDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Check if code already exists
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Ingredient with code '{dto.Code}' already exists");
        }

        // Verify category exists
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new InvalidOperationException("Category not found");
        }

        // Verify unit of measure exists
        var uomExists = await _context.UnitOfMeasures.AnyAsync(u => u.Id == dto.UnitOfMeasureId, cancellationToken);
        if (!uomExists)
        {
            throw new InvalidOperationException("Unit of measure not found");
        }

        var ingredient = _mapper.Map<Ingredient>(dto);
        ingredient.CreatedById = userId;
        ingredient.UpdatedById = userId;

        _context.Ingredients.Add(ingredient);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("IngredientService", $"Ingredient created: {ingredient.Code} by user {userId}");

        // Reload with includes
        return (await GetByIdAsync(ingredient.Id, cancellationToken))!;
    }

    public async Task<IngredientDetailDto> UpdateAsync(
        Guid id,
        UpdateIngredientDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var ingredient = await _context.Ingredients.FindAsync(new object[] { id }, cancellationToken);
        if (ingredient == null)
        {
            throw new InvalidOperationException("Ingredient not found");
        }

        // Check if code is being changed and if the new code already exists
        if (ingredient.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Ingredient with code '{dto.Code}' already exists");
        }

        // Verify category exists
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new InvalidOperationException("Category not found");
        }

        // Verify unit of measure exists
        var uomExists = await _context.UnitOfMeasures.AnyAsync(u => u.Id == dto.UnitOfMeasureId, cancellationToken);
        if (!uomExists)
        {
            throw new InvalidOperationException("Unit of measure not found");
        }

        ingredient.Code = dto.Code;
        ingredient.Name = dto.Name;
        ingredient.Description = dto.Description;
        ingredient.CategoryId = dto.CategoryId;
        ingredient.UnitOfMeasureId = dto.UnitOfMeasureId;
        ingredient.IngredientType = dto.IngredientType;
        ingredient.IsSemiFinishedItem = dto.IsSemiFinishedItem;
        ingredient.ExtraPercentageApplicable = dto.ExtraPercentageApplicable;
        ingredient.ExtraPercentage = dto.ExtraPercentage;
        ingredient.AllowExtraQty = dto.AllowExtraQty;
        ingredient.ExtraQtyNote = dto.ExtraQtyNote;
        ingredient.AllowDecimal = dto.AllowDecimal;
        ingredient.DecimalPlaces = dto.DecimalPlaces;
        ingredient.UnitPrice = dto.UnitPrice;
        ingredient.SortOrder = dto.SortOrder;
        ingredient.ReorderThreshold = dto.ReorderThreshold;
        ingredient.LowStockAlertEnabled = dto.LowStockAlertEnabled;
        ingredient.LowStockThreshold = dto.LowStockThreshold;
        ingredient.IsActive = dto.IsActive;
        ingredient.UpdatedById = userId;
        ingredient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("IngredientService", $"Ingredient updated: {ingredient.Code} by user {userId}");

        // Reload with includes
        return (await GetByIdAsync(ingredient.Id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var ingredient = await _context.Ingredients
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (ingredient == null)
        {
            throw new InvalidOperationException("Ingredient not found");
        }

        // Soft delete
        ingredient.IsActive = false;
        ingredient.UpdatedById = userId;
        ingredient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("IngredientService", $"Ingredient soft-deleted: {ingredient.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Ingredients.Where(i => i.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(i => i.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
