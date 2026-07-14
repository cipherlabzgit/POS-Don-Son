using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.UnitOfMeasures;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class UnitOfMeasureService : IUnitOfMeasureService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public UnitOfMeasureService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<UnitOfMeasureListItemDto> unitOfMeasures, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UnitOfMeasures
            .Include(u => u.Products)
            .Include(u => u.Ingredients)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(u => u.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(u =>
                u.Code.Contains(searchTerm) ||
                u.Description.Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var unitOfMeasures = await query
            .OrderBy(u => u.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var uomDtos = _mapper.Map<List<UnitOfMeasureListItemDto>>(unitOfMeasures);

        return (uomDtos, totalCount);
    }

    public async Task<UnitOfMeasureDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var uom = await _context.UnitOfMeasures
            .Include(u => u.Products)
            .Include(u => u.Ingredients)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (uom == null)
        {
            return null;
        }

        return _mapper.Map<UnitOfMeasureDetailDto>(uom);
    }

    public async Task<UnitOfMeasureDetailDto> CreateAsync(
        CreateUnitOfMeasureDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Check if code already exists
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Unit of measure with code '{dto.Code}' already exists");
        }

        var uom = _mapper.Map<UnitOfMeasure>(dto);
        uom.CreatedById = userId;
        uom.UpdatedById = userId;

        _context.UnitOfMeasures.Add(uom);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("UnitOfMeasureService", $"Unit of measure created: {uom.Code} by user {userId}");

        return _mapper.Map<UnitOfMeasureDetailDto>(uom);
    }

    public async Task<UnitOfMeasureDetailDto> UpdateAsync(
        Guid id,
        UpdateUnitOfMeasureDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var uom = await _context.UnitOfMeasures.FindAsync(new object[] { id }, cancellationToken);
        if (uom == null)
        {
            throw new InvalidOperationException("Unit of measure not found");
        }

        // Check if code is being changed and if the new code already exists
        if (uom.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Unit of measure with code '{dto.Code}' already exists");
        }

        uom.Code = dto.Code;
        uom.Description = dto.Description;
        uom.IsActive = dto.IsActive;
        uom.UpdatedById = userId;
        uom.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("UnitOfMeasureService", $"Unit of measure updated: {uom.Code} by user {userId}");

        return _mapper.Map<UnitOfMeasureDetailDto>(uom);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var uom = await _context.UnitOfMeasures
            .Include(u => u.Products)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (uom == null)
        {
            throw new InvalidOperationException("Unit of measure not found");
        }

            // Check if UOM has associated products or ingredients
            var hasActiveProducts = uom.Products != null && uom.Products.Any(p => p.IsActive);
            var hasActiveIngredients = uom.Ingredients != null && uom.Ingredients.Any(i => i.IsActive);
            
            if (hasActiveProducts || hasActiveIngredients)
            {
                throw new InvalidOperationException("Cannot delete unit of measure with active products or ingredients. Deactivate it instead.");
            }

        // Soft delete
        uom.IsActive = false;
        uom.UpdatedById = userId;
        uom.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("UnitOfMeasureService", $"Unit of measure soft-deleted: {uom.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UnitOfMeasures.Where(u => u.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(u => u.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
