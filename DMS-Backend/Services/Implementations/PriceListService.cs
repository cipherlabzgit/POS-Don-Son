using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.PriceLists;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class PriceListService : IPriceListService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;

    public PriceListService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
    }

    public async Task<(List<PriceListListDto> priceLists, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PriceLists
            .Include(pl => pl.PriceListItems)
            .Include(pl => pl.CreatedBy)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(pl => pl.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(pl =>
                pl.Code.Contains(searchTerm) ||
                pl.Name.Contains(searchTerm) ||
                (pl.Description != null && pl.Description.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var priceLists = await query
            .OrderBy(pl => pl.Priority)
            .ThenBy(pl => pl.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var priceListDtos = _mapper.Map<List<PriceListListDto>>(priceLists);

        return (priceListDtos, totalCount);
    }

    public async Task<PriceListDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var priceList = await _context.PriceLists
            .Include(pl => pl.PriceListItems)
            .FirstOrDefaultAsync(pl => pl.Id == id, cancellationToken);

        if (priceList == null)
        {
            return null;
        }

        return _mapper.Map<PriceListDetailDto>(priceList);
    }

    public async Task<PriceListDetailDto> CreateAsync(
        PriceListCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Price list with code '{dto.Code}' already exists");
        }

        var priceList = _mapper.Map<PriceList>(dto);
        priceList.CreatedById = userId;
        priceList.UpdatedById = userId;

        _context.PriceLists.Add(priceList);
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("PriceListService", $"Price list created: {priceList.Code} by user {userId}");

        return _mapper.Map<PriceListDetailDto>(priceList);
    }

    public async Task<PriceListDetailDto> UpdateAsync(
        Guid id,
        PriceListUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var priceList = await _context.PriceLists.FindAsync(new object[] { id }, cancellationToken);
        if (priceList == null)
        {
            throw new InvalidOperationException("Price list not found");
        }

        if (priceList.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Price list with code '{dto.Code}' already exists");
        }

        priceList.Code = dto.Code;
        priceList.Name = dto.Name;
        priceList.Description = dto.Description;
        priceList.PriceListType = dto.PriceListType;
        priceList.Currency = dto.Currency;
        priceList.EffectiveFrom = dto.EffectiveFrom;
        priceList.EffectiveTo = dto.EffectiveTo;
        priceList.IsDefault = dto.IsDefault;
        priceList.Priority = dto.Priority;
        priceList.IsActive = dto.IsActive;
        priceList.UpdatedById = userId;
        priceList.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("PriceListService", $"Price list updated: {priceList.Code} by user {userId}");

        return _mapper.Map<PriceListDetailDto>(priceList);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var priceList = await _context.PriceLists
            .Include(pl => pl.PriceListItems)
            .FirstOrDefaultAsync(pl => pl.Id == id, cancellationToken);

        if (priceList == null)
        {
            throw new InvalidOperationException("Price list not found");
        }

        priceList.IsActive = false;
        priceList.UpdatedById = userId;
        priceList.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("PriceListService", $"Price list soft-deleted: {priceList.Code} by user {userId}");
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PriceLists.Where(pl => pl.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(pl => pl.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
