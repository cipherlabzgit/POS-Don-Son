using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.RecipePlans;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class RecipePlanService : IRecipePlanService
{
    private readonly ApplicationDbContext _context;

    public RecipePlanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RecipePlanListDto>> GetAllAsync(bool? activeOnly = null, CancellationToken cancellationToken = default)
    {
        var query = _context.RecipePlans
            .Include(rp => rp.RecipePlanItems)
            .AsQueryable();

        if (activeOnly == true)
            query = query.Where(rp => rp.IsActive);

        return await query
            .OrderBy(rp => rp.SortOrder)
            .ThenBy(rp => rp.Code)
            .Select(rp => new RecipePlanListDto
            {
                Id = rp.Id,
                Code = rp.Code,
                Name = rp.Name,
                Description = rp.Description,
                EffectiveFrom = rp.EffectiveFrom,
                EffectiveTo = rp.EffectiveTo,
                IsDefault = rp.IsDefault,
                SortOrder = rp.SortOrder,
                ItemCount = rp.RecipePlanItems.Count,
                IsActive = rp.IsActive,
                CreatedAt = rp.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RecipePlanDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.RecipePlans
            .Include(rp => rp.RecipePlanItems)
                .ThenInclude(rpi => rpi.Product)
            .Include(rp => rp.RecipePlanItems)
                .ThenInclude(rpi => rpi.Recipe)
            .FirstOrDefaultAsync(rp => rp.Id == id, cancellationToken);

        return plan == null ? null : ToDetailDto(plan);
    }

    public async Task<RecipePlanDetailDto> CreateAsync(CreateRecipePlanDto dto, CancellationToken cancellationToken = default)
    {
        if (await _context.RecipePlans.AnyAsync(rp => rp.Code == dto.Code, cancellationToken))
            throw new InvalidOperationException($"Recipe plan with code '{dto.Code}' already exists");

        if (dto.IsDefault)
            await ClearDefaultAsync(cancellationToken);

        var plan = new RecipePlan
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            EffectiveFrom = dto.EffectiveFrom,
            EffectiveTo = dto.EffectiveTo,
            IsDefault = dto.IsDefault,
            SortOrder = dto.SortOrder
        };

        foreach (var itemDto in dto.Items)
        {
            plan.RecipePlanItems.Add(new RecipePlanItem
            {
                Id = Guid.NewGuid(),
                RecipePlanId = plan.Id,
                ProductId = itemDto.ProductId,
                RecipeId = itemDto.RecipeId,
                Notes = itemDto.Notes
            });
        }

        _context.RecipePlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(plan.Id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve created plan");
    }

    public async Task<RecipePlanDetailDto?> UpdateAsync(Guid id, UpdateRecipePlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.RecipePlans
            .FirstOrDefaultAsync(rp => rp.Id == id, cancellationToken);

        if (plan == null) return null;

        if (dto.Name != null) plan.Name = dto.Name;
        if (dto.Description != null) plan.Description = dto.Description;
        if (dto.EffectiveFrom.HasValue) plan.EffectiveFrom = dto.EffectiveFrom;
        if (dto.EffectiveTo.HasValue) plan.EffectiveTo = dto.EffectiveTo;
        if (dto.SortOrder.HasValue) plan.SortOrder = dto.SortOrder.Value;

        if (dto.IsDefault.HasValue && dto.IsDefault.Value && !plan.IsDefault)
        {
            await ClearDefaultAsync(cancellationToken);
            plan.IsDefault = true;
        }
        else if (dto.IsDefault.HasValue)
        {
            plan.IsDefault = dto.IsDefault.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.RecipePlans
            .FirstOrDefaultAsync(rp => rp.Id == id, cancellationToken);

        if (plan == null) return false;

        plan.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<RecipePlanDetailDto?> AddItemAsync(Guid planId, CreateRecipePlanItemDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.RecipePlans
            .FirstOrDefaultAsync(rp => rp.Id == planId, cancellationToken);

        if (plan == null) return null;

        var duplicate = await _context.RecipePlanItems
            .AnyAsync(rpi => rpi.RecipePlanId == planId && rpi.ProductId == dto.ProductId, cancellationToken);

        if (duplicate)
            throw new InvalidOperationException("This product already has a recipe assigned in this plan");

        var item = new RecipePlanItem
        {
            Id = Guid.NewGuid(),
            RecipePlanId = planId,
            ProductId = dto.ProductId,
            RecipeId = dto.RecipeId,
            Notes = dto.Notes
        };

        _context.RecipePlanItems.Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(planId, cancellationToken);
    }

    public async Task<bool> RemoveItemAsync(Guid planId, Guid itemId, CancellationToken cancellationToken = default)
    {
        var item = await _context.RecipePlanItems
            .FirstOrDefaultAsync(rpi => rpi.Id == itemId && rpi.RecipePlanId == planId, cancellationToken);

        if (item == null) return false;

        item.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ClearDefaultAsync(CancellationToken cancellationToken)
    {
        var defaults = await _context.RecipePlans
            .Where(rp => rp.IsDefault)
            .ToListAsync(cancellationToken);
        foreach (var p in defaults)
            p.IsDefault = false;
    }

    private static RecipePlanDetailDto ToDetailDto(RecipePlan plan) => new()
    {
        Id = plan.Id,
        Code = plan.Code,
        Name = plan.Name,
        Description = plan.Description,
        EffectiveFrom = plan.EffectiveFrom,
        EffectiveTo = plan.EffectiveTo,
        IsDefault = plan.IsDefault,
        SortOrder = plan.SortOrder,
        IsActive = plan.IsActive,
        CreatedAt = plan.CreatedAt,
        UpdatedAt = plan.UpdatedAt,
        Items = plan.RecipePlanItems.Select(rpi => new RecipePlanItemDto
        {
            Id = rpi.Id,
            RecipePlanId = rpi.RecipePlanId,
            ProductId = rpi.ProductId,
            ProductCode = rpi.Product?.Code ?? string.Empty,
            ProductName = rpi.Product?.Name ?? string.Empty,
            RecipeId = rpi.RecipeId,
            RecipeName = rpi.Recipe?.RecipeName ?? string.Empty,
            Notes = rpi.Notes
        }).ToList()
    };
}
