using System.Text.Json;
using AutoMapper;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.PriceLists;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class PriceListService : IPriceListService
{
    public const string PriceChangeApprovalType = "Price Change";
    public const string StatusPending = "Pending";
    public const string StatusApproved = "Approved";
    public const string StatusRejected = "Rejected";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISystemLogService _systemLogService;
    private readonly IProductPriceResolver _priceResolver;

    public PriceListService(
        ApplicationDbContext context,
        IMapper mapper,
        ISystemLogService systemLogService,
        IProductPriceResolver priceResolver)
    {
        _context = context;
        _mapper = mapper;
        _systemLogService = systemLogService;
        _priceResolver = priceResolver;
    }

    public static bool IsPriceChangeApprovalType(string? approvalType) =>
        string.Equals(approvalType, PriceChangeApprovalType, StringComparison.Ordinal);

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
            .OrderByDescending(pl => pl.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var priceListDtos = _mapper.Map<List<PriceListListDto>>(priceLists);

        return (priceListDtos, totalCount);
    }

    public async Task<PriceListDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var priceList = await _context.PriceLists
            .Include(pl => pl.CreatedBy)
            .Include(pl => pl.PriceListItems!)
                .ThenInclude(i => i.Product)
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

        var lines = NormalizeLines(dto.Items);
        var effectiveFromUtc = NormalizeEffectiveFromUtc(dto.EffectiveFrom);
        var products = await LoadProductsAsync(lines.Select(i => i.ProductId), cancellationToken);
        var previousPrices = await ResolvePreviousPricesAsync(effectiveFromUtc, lines.Select(i => i.ProductId), cancellationToken);

        var now = DateTime.UtcNow;
        var priceList = _mapper.Map<PriceList>(dto);
        priceList.Id = Guid.NewGuid();
        priceList.EffectiveFrom = effectiveFromUtc;
        priceList.EffectiveTo = null;
        priceList.PriceListType = StatusPending;
        priceList.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "LKR" : dto.Currency;
        priceList.CreatedById = userId;
        priceList.UpdatedById = userId;
        priceList.CreatedAt = now;
        priceList.UpdatedAt = now;
        priceList.PriceListItems = BuildItems(lines, products, previousPrices, userId, now);

        _context.PriceLists.Add(priceList);

        var requestPayload = BuildRequestPayload(priceList, products);
        _context.ApprovalQueues.Add(new ApprovalQueue
        {
            Id = Guid.NewGuid(),
            ApprovalType = PriceChangeApprovalType,
            EntityId = priceList.Id,
            EntityReference = priceList.Code,
            RequestedById = userId,
            RequestedAt = now,
            Status = StatusPending,
            Priority = 0,
            Notes = priceList.Description ?? priceList.Name,
            RequestData = JsonSerializer.Serialize(requestPayload, JsonOpts),
            IsActive = true,
            CreatedById = userId,
            UpdatedById = userId,
            CreatedAt = now,
            UpdatedAt = now,
        });

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync(
            "PriceListService",
            $"Price change submitted for approval: {priceList.Code} ({lines.Count} items) by user {userId}");

        return (await GetByIdAsync(priceList.Id, cancellationToken))!;
    }

    public async Task<PriceListDetailDto> UpdateAsync(
        Guid id,
        PriceListUpdateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var priceList = await _context.PriceLists
            .Include(pl => pl.PriceListItems)
            .FirstOrDefaultAsync(pl => pl.Id == id, cancellationToken);
        if (priceList == null)
        {
            throw new InvalidOperationException("Price list not found");
        }

        if (!string.Equals(priceList.PriceListType, StatusPending, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(priceList.PriceListType)
            && !string.Equals(priceList.PriceListType, "Standard", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only pending price changes can be edited.");
        }

        if (priceList.Code != dto.Code && await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Price list with code '{dto.Code}' already exists");
        }

        var lines = NormalizeLines(dto.Items);
        var effectiveFromUtc = NormalizeEffectiveFromUtc(dto.EffectiveFrom);
        var products = await LoadProductsAsync(lines.Select(i => i.ProductId), cancellationToken);
        var previousPrices = await ResolvePreviousPricesAsync(effectiveFromUtc, lines.Select(i => i.ProductId), cancellationToken);
        var now = DateTime.UtcNow;

        priceList.Code = dto.Code;
        priceList.Name = dto.Name;
        priceList.Description = dto.Description;
        priceList.PriceListType = StatusPending;
        priceList.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "LKR" : dto.Currency;
        priceList.EffectiveFrom = effectiveFromUtc;
        priceList.EffectiveTo = null;
        priceList.IsDefault = dto.IsDefault;
        priceList.Priority = dto.Priority;
        priceList.IsActive = dto.IsActive;
        priceList.UpdatedById = userId;
        priceList.UpdatedAt = now;

        SyncItems(priceList, lines, products, previousPrices, userId, now);

        var pending = await _context.ApprovalQueues.FirstOrDefaultAsync(
            q => q.EntityId == id
                 && q.ApprovalType == PriceChangeApprovalType
                 && q.Status == StatusPending
                 && q.IsActive,
            cancellationToken);

        var payload = BuildRequestPayload(priceList, products);
        var json = JsonSerializer.Serialize(payload, JsonOpts);
        if (pending != null)
        {
            pending.RequestData = json;
            pending.Notes = priceList.Description ?? priceList.Name;
            pending.EntityReference = priceList.Code;
            pending.UpdatedById = userId;
            pending.UpdatedAt = now;
        }
        else
        {
            _context.ApprovalQueues.Add(new ApprovalQueue
            {
                Id = Guid.NewGuid(),
                ApprovalType = PriceChangeApprovalType,
                EntityId = priceList.Id,
                EntityReference = priceList.Code,
                RequestedById = userId,
                RequestedAt = now,
                Status = StatusPending,
                Priority = 0,
                Notes = priceList.Description ?? priceList.Name,
                RequestData = json,
                IsActive = true,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("PriceListService", $"Price change updated: {priceList.Code} by user {userId}");

        return (await GetByIdAsync(id, cancellationToken))!;
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

    private static List<PriceListItemLineDto> NormalizeLines(IEnumerable<PriceListItemLineDto>? items)
    {
        var list = (items ?? Enumerable.Empty<PriceListItemLineDto>())
            .Where(i => i.ProductId != Guid.Empty)
            .GroupBy(i => i.ProductId)
            .Select(g => g.Last())
            .ToList();

        if (list.Count == 0)
        {
            throw new InvalidOperationException("At least one product price change is required.");
        }

        return list;
    }

    private async Task<Dictionary<Guid, Product>> LoadProductsAsync(
        IEnumerable<Guid> productIds,
        CancellationToken cancellationToken)
    {
        var ids = productIds.Distinct().ToList();
        var products = await _context.Products
            .Where(p => ids.Contains(p.Id))
            .ToListAsync(cancellationToken);

        if (products.Count != ids.Count)
        {
            throw new InvalidOperationException("One or more products were not found.");
        }

        return products.ToDictionary(p => p.Id);
    }

    private async Task<Dictionary<Guid, decimal>> ResolvePreviousPricesAsync(
        DateTime effectiveFrom,
        IEnumerable<Guid> productIds,
        CancellationToken cancellationToken)
    {
        var effectiveDate = DeliveryPlanPreloadRules.ResolvePlanBusinessDateSriLanka(effectiveFrom);
        var asOf = effectiveDate.AddDays(-1);
        return await _priceResolver.ResolveAsync(productIds, asOf, cancellationToken);
    }

    private static DateTime NormalizeEffectiveFromUtc(DateTime value)
    {
        var slDate = DeliveryPlanPreloadRules.ResolvePlanBusinessDateSriLanka(value);
        return DeliveryPlanPreloadRules.SlDateToUtcMidnight(slDate);
    }

    private void SyncItems(
        PriceList priceList,
        List<PriceListItemLineDto> lines,
        Dictionary<Guid, Product> products,
        Dictionary<Guid, decimal> previousPrices,
        Guid userId,
        DateTime now)
    {
        var existing = (priceList.PriceListItems ?? new List<PriceListItem>()).ToList();
        var incomingIds = lines.Select(l => l.ProductId).ToHashSet();

        foreach (var stale in existing.Where(i => !incomingIds.Contains(i.ProductId)))
        {
            _context.PriceListItems.Remove(stale);
        }

        var byProduct = existing
            .Where(i => incomingIds.Contains(i.ProductId))
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.First());

        var next = new List<PriceListItem>();
        foreach (var line in lines)
        {
            var product = products[line.ProductId];
            previousPrices.TryGetValue(product.Id, out var resolvedPrevious);
            var previous = previousPrices.ContainsKey(product.Id) ? resolvedPrevious : product.UnitPrice;

            if (byProduct.TryGetValue(line.ProductId, out var row))
            {
                row.UnitPrice = line.UnitPrice;
                row.PreviousUnitPrice = previous;
                row.IsActive = true;
                row.UpdatedById = userId;
                row.UpdatedAt = now;
                next.Add(row);
                continue;
            }

            next.Add(new PriceListItem
            {
                Id = Guid.NewGuid(),
                PriceListId = priceList.Id,
                ProductId = product.Id,
                UnitPrice = line.UnitPrice,
                PreviousUnitPrice = previous,
                IsActive = true,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        priceList.PriceListItems = next;
    }

    private static List<PriceListItem> BuildItems(
        List<PriceListItemLineDto> lines,
        Dictionary<Guid, Product> products,
        Dictionary<Guid, decimal> previousPrices,
        Guid userId,
        DateTime now)
    {
        return lines.Select(line =>
        {
            var product = products[line.ProductId];
            previousPrices.TryGetValue(product.Id, out var resolvedPrevious);
            var previous = previousPrices.ContainsKey(product.Id) ? resolvedPrevious : product.UnitPrice;
            return new PriceListItem
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                UnitPrice = line.UnitPrice,
                PreviousUnitPrice = previous,
                IsActive = true,
                CreatedById = userId,
                UpdatedById = userId,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }).ToList();
    }

    private static object BuildRequestPayload(PriceList priceList, Dictionary<Guid, Product> products)
    {
        var items = (priceList.PriceListItems ?? Enumerable.Empty<PriceListItem>()).Select(item =>
        {
            products.TryGetValue(item.ProductId, out var product);
            return new
            {
                productId = item.ProductId,
                productCode = product?.Code ?? string.Empty,
                productName = product?.Name ?? string.Empty,
                previousPrice = item.PreviousUnitPrice,
                newPrice = item.UnitPrice,
            };
        }).ToList();

        return new
        {
            code = priceList.Code,
            comment = priceList.Description ?? priceList.Name,
            effectiveFrom = priceList.EffectiveFrom,
            itemCount = items.Count,
            items,
        };
    }
}
