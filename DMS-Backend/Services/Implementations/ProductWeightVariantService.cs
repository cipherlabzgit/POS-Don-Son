using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.ProductWeightVariants;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ProductWeightVariantService : IProductWeightVariantService
{
    private readonly ApplicationDbContext _context;

    public ProductWeightVariantService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductWeightVariantDto>> GetByProductAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await _context.ProductWeightVariants
            .Where(v => v.ProductId == productId)
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.Label)
            .Select(v => ToDto(v))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductWeightVariantDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductWeightVariants
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        return variant == null ? null : ToDto(variant);
    }

    public async Task<ProductWeightVariantDto> CreateAsync(CreateProductWeightVariantDto dto, CancellationToken cancellationToken = default)
    {
        var variant = new ProductWeightVariant
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            Label = dto.Label,
            WeightGrams = dto.WeightGrams,
            IsDefault = dto.IsDefault,
            SortOrder = dto.SortOrder
        };

        if (dto.IsDefault)
            await ClearDefaultAsync(dto.ProductId, cancellationToken);

        _context.ProductWeightVariants.Add(variant);
        await _context.SaveChangesAsync(cancellationToken);
        return ToDto(variant);
    }

    public async Task<ProductWeightVariantDto?> UpdateAsync(Guid id, UpdateProductWeightVariantDto dto, CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductWeightVariants
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (variant == null) return null;

        if (dto.Label != null) variant.Label = dto.Label;
        if (dto.WeightGrams.HasValue) variant.WeightGrams = dto.WeightGrams.Value;
        if (dto.SortOrder.HasValue) variant.SortOrder = dto.SortOrder.Value;

        if (dto.IsDefault.HasValue && dto.IsDefault.Value && !variant.IsDefault)
        {
            await ClearDefaultAsync(variant.ProductId, cancellationToken);
            variant.IsDefault = true;
        }
        else if (dto.IsDefault.HasValue)
        {
            variant.IsDefault = dto.IsDefault.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ToDto(variant);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductWeightVariants
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (variant == null) return false;

        variant.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProductWeightVariantDto?> SetDefaultAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductWeightVariants
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (variant == null) return null;

        await ClearDefaultAsync(variant.ProductId, cancellationToken);
        variant.IsDefault = true;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDto(variant);
    }

    private async Task ClearDefaultAsync(Guid productId, CancellationToken cancellationToken)
    {
        var existing = await _context.ProductWeightVariants
            .Where(v => v.ProductId == productId && v.IsDefault)
            .ToListAsync(cancellationToken);
        foreach (var v in existing)
            v.IsDefault = false;
    }

    private static ProductWeightVariantDto ToDto(ProductWeightVariant v) => new()
    {
        Id = v.Id,
        ProductId = v.ProductId,
        Label = v.Label,
        WeightGrams = v.WeightGrams,
        IsDefault = v.IsDefault,
        SortOrder = v.SortOrder,
        CreatedAt = v.CreatedAt,
        UpdatedAt = v.UpdatedAt
    };
}
