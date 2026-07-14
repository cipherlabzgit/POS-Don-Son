using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Orders;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<OrderService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<OrderListDto> orders, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? deliveryPlanId = null,
        bool customOrdersOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<OrderHeader>()
            .Include(oh => oh.DeliveryPlan)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(oh => oh.OrderDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(oh => oh.OrderDate <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(oh => oh.Status == status);
        }

        if (deliveryPlanId.HasValue)
        {
            query = query.Where(oh => oh.DeliveryPlanId == deliveryPlanId.Value);
        }

        if (customOrdersOnly)
        {
            query = query.Where(oh => oh.DeliveryPlanId == null);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .OrderByDescending(oh => oh.OrderDate)
            .ThenBy(oh => oh.OrderNo)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(oh => new OrderListDto
            {
                Id = oh.Id,
                OrderNo = oh.OrderNo,
                OrderDate = oh.OrderDate,
                DeliveryDate = oh.DeliveryDate,
                DeliveryTime = oh.DeliveryTime,
                ProductionStartingDate = oh.ProductionStartingDate,
                ProductionStartingTime = oh.ProductionStartingTime,
                RecipeRequestNumber = oh.RecipeRequestNumber,
                DeliveryPlanId = oh.DeliveryPlanId,
                DeliveryPlanNo = oh.DeliveryPlan != null ? oh.DeliveryPlan.PlanNo : null,
                Status = oh.Status,
                UseFreezerStock = oh.UseFreezerStock,
                TotalItems = oh.TotalItems,
                UpdatedAt = oh.UpdatedAt,
                IsCustomOrder = oh.DeliveryPlanId == null,
            })
            .ToListAsync(cancellationToken);

        return (orders, totalCount);
    }

    public async Task<OrderDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .Include(oh => oh.DeliveryPlan)
            .Include(oh => oh.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(oh => oh.OrderItems)
                .ThenInclude(oi => oi.Outlet)
            .Include(oh => oh.OrderItems)
                .ThenInclude(oi => oi.DeliveryTurn)
            .FirstOrDefaultAsync(oh => oh.Id == id, cancellationToken);

        if (order == null)
        {
            return null;
        }

        return new OrderDetailDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            OrderDate = order.OrderDate,
            DeliveryDate = order.DeliveryDate,
            DeliveryTime = order.DeliveryTime,
            ProductionStartingDate = order.ProductionStartingDate,
            ProductionStartingTime = order.ProductionStartingTime,
            RecipeRequestNumber = order.RecipeRequestNumber,
            DeliveryPlanId = order.DeliveryPlanId,
            DeliveryPlanNo = order.DeliveryPlan?.PlanNo,
            Status = order.Status,
            UseFreezerStock = order.UseFreezerStock,
            TotalItems = order.TotalItems,
            Notes = order.Notes,
            IsCustomOrder = order.DeliveryPlanId == null,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                OrderHeaderId = oi.OrderHeaderId,
                ProductId = oi.ProductId,
                ProductName = oi.Product!.Name,
                OutletId = oi.OutletId,
                OutletName = oi.Outlet!.Name,
                DeliveryTurnId = oi.DeliveryTurnId,
                DeliveryTurnName = oi.DeliveryTurn!.Name,
                FullQuantity = oi.FullQuantity,
                MiniQuantity = oi.MiniQuantity,
                IsExtra = oi.IsExtra,
                IsCustomized = oi.IsCustomized,
                CustomizationNotes = oi.CustomizationNotes,
                Notes = oi.Notes
            }).ToList(),
            IsActive = order.IsActive,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            CreatedById = order.CreatedById,
            UpdatedById = order.UpdatedById
        };
    }

    public async Task<OrderDetailDto?> GetByOrderNoAsync(string orderNo, CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .FirstOrDefaultAsync(oh => oh.OrderNo == orderNo, cancellationToken);

        if (order == null)
        {
            return null;
        }

        return await GetByIdAsync(order.Id, cancellationToken);
    }

    public async Task<IEnumerable<OrderListDto>> GetByDateAndTurnAsync(
        DateTime date,
        Guid turnId,
        CancellationToken cancellationToken = default)
    {
        date = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var orders = await _context.Set<OrderHeader>()
            .Include(oh => oh.DeliveryPlan)
            .Include(oh => oh.OrderItems)
            .Where(oh => oh.OrderDate.Date == date &&
                         oh.OrderItems.Any(oi => oi.DeliveryTurnId == turnId))
            .Select(oh => new OrderListDto
            {
                Id = oh.Id,
                OrderNo = oh.OrderNo,
                OrderDate = oh.OrderDate,
                DeliveryDate = oh.DeliveryDate,
                DeliveryTime = oh.DeliveryTime,
                ProductionStartingDate = oh.ProductionStartingDate,
                ProductionStartingTime = oh.ProductionStartingTime,
                RecipeRequestNumber = oh.RecipeRequestNumber,
                DeliveryPlanId = oh.DeliveryPlanId,
                DeliveryPlanNo = oh.DeliveryPlan != null ? oh.DeliveryPlan.PlanNo : null,
                Status = oh.Status,
                UseFreezerStock = oh.UseFreezerStock,
                TotalItems = oh.TotalItems,
                UpdatedAt = oh.UpdatedAt,
                IsCustomOrder = oh.DeliveryPlanId == null,
            })
            .ToListAsync(cancellationToken);

        return orders;
    }

    public async Task<OrderDetailDto> CreateAsync(
        CreateOrderDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var exists = await _context.Set<OrderHeader>()
            .AnyAsync(oh => oh.OrderNo == dto.OrderNo, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Order with number '{dto.OrderNo}' already exists.");
        }

        var order = _mapper.Map<OrderHeader>(dto);
        order.Id = Guid.NewGuid();
        order.Status = "Draft";
        order.TotalItems = 0;
        order.CreatedById = userId;
        order.UpdatedById = userId;
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _context.Set<OrderHeader>().Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order created: {OrderNo} for {OrderDate}", order.OrderNo, order.OrderDate);

        return (await GetByIdAsync(order.Id, cancellationToken))!;
    }

    public async Task<OrderDetailDto> UpdateAsync(
        Guid id,
        UpdateOrderDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .FirstOrDefaultAsync(oh => oh.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Order with ID '{id}' not found.");
        }

        if (order.Status != "Draft")
        {
            throw new InvalidOperationException("Only draft orders can be updated.");
        }

        _mapper.Map(dto, order);
        order.UpdatedById = userId;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order updated: {OrderNo}", order.OrderNo);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .FirstOrDefaultAsync(oh => oh.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Order with ID '{id}' not found.");
        }

        if (order.Status != "Draft")
        {
            throw new InvalidOperationException("Only draft orders can be deleted.");
        }

        order.IsActive = false;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order soft-deleted: {OrderNo}", order.OrderNo);
    }

    public async Task<OrderDetailDto> SubmitAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .FirstOrDefaultAsync(oh => oh.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Order with ID '{id}' not found.");
        }

        if (order.Status != "Draft")
        {
            throw new InvalidOperationException("Order is not in draft status.");
        }

        order.Status = "Submitted";
        order.UpdatedById = userId;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order submitted: {OrderNo}", order.OrderNo);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<IEnumerable<OrderItemDto>> BulkUpsertItemsAsync(
        Guid orderId,
        List<BulkUpsertOrderItemDto> items,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<OrderHeader>()
            .Include(oh => oh.OrderItems)
            .FirstOrDefaultAsync(oh => oh.Id == orderId, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Order with ID '{orderId}' not found.");
        }

        if (order.Status != "Draft")
        {
            throw new InvalidOperationException("Only draft orders can have items modified.");
        }

        var results = new List<OrderItemDto>();

        foreach (var itemDto in items)
        {
            var existing = await _context.Set<OrderItem>()
                .Include(oi => oi.Product)
                .Include(oi => oi.Outlet)
                .Include(oi => oi.DeliveryTurn)
                .FirstOrDefaultAsync(oi =>
                    oi.OrderHeaderId == orderId &&
                    oi.ProductId == itemDto.ProductId &&
                    oi.OutletId == itemDto.OutletId &&
                    oi.DeliveryTurnId == itemDto.DeliveryTurnId,
                    cancellationToken);

            if (existing != null)
            {
                existing.FullQuantity = itemDto.FullQuantity;
                existing.MiniQuantity = itemDto.MiniQuantity;
                existing.IsExtra = itemDto.IsExtra;
                existing.IsCustomized = itemDto.IsCustomized;
                existing.CustomizationNotes = itemDto.CustomizationNotes;
                existing.Notes = itemDto.Notes;
                existing.UpdatedById = userId;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                results.Add(new OrderItemDto
                {
                    Id = existing.Id,
                    OrderHeaderId = existing.OrderHeaderId,
                    ProductId = existing.ProductId,
                    ProductName = existing.Product!.Name,
                    OutletId = existing.OutletId,
                    OutletName = existing.Outlet!.Name,
                    DeliveryTurnId = existing.DeliveryTurnId,
                    DeliveryTurnName = existing.DeliveryTurn!.Name,
                    FullQuantity = existing.FullQuantity,
                    MiniQuantity = existing.MiniQuantity,
                    IsExtra = existing.IsExtra,
                    IsCustomized = existing.IsCustomized,
                    CustomizationNotes = existing.CustomizationNotes,
                    Notes = existing.Notes
                });
            }
            else
            {
                var newItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderHeaderId = orderId,
                    ProductId = itemDto.ProductId,
                    OutletId = itemDto.OutletId,
                    DeliveryTurnId = itemDto.DeliveryTurnId,
                    FullQuantity = itemDto.FullQuantity,
                    MiniQuantity = itemDto.MiniQuantity,
                    IsExtra = itemDto.IsExtra,
                    IsCustomized = itemDto.IsCustomized,
                    CustomizationNotes = itemDto.CustomizationNotes,
                    Notes = itemDto.Notes,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Set<OrderItem>().Add(newItem);
                await _context.SaveChangesAsync(cancellationToken);

                var addedItem = await _context.Set<OrderItem>()
                    .Include(oi => oi.Product)
                    .Include(oi => oi.Outlet)
                    .Include(oi => oi.DeliveryTurn)
                    .FirstAsync(oi => oi.Id == newItem.Id, cancellationToken);

                results.Add(new OrderItemDto
                {
                    Id = addedItem.Id,
                    OrderHeaderId = addedItem.OrderHeaderId,
                    ProductId = addedItem.ProductId,
                    ProductName = addedItem.Product!.Name,
                    OutletId = addedItem.OutletId,
                    OutletName = addedItem.Outlet!.Name,
                    DeliveryTurnId = addedItem.DeliveryTurnId,
                    DeliveryTurnName = addedItem.DeliveryTurn!.Name,
                    FullQuantity = addedItem.FullQuantity,
                    MiniQuantity = addedItem.MiniQuantity,
                    IsExtra = addedItem.IsExtra,
                    IsCustomized = addedItem.IsCustomized,
                    CustomizationNotes = addedItem.CustomizationNotes,
                    Notes = addedItem.Notes
                });
            }
        }

        order.TotalItems = await _context.Set<OrderItem>()
            .CountAsync(oi => oi.OrderHeaderId == orderId && oi.IsActive, cancellationToken);
        order.UpdatedById = userId;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk upsert completed for order {OrderNo}: {Count} items processed",
            order.OrderNo, items.Count);

        return results;
    }
}
