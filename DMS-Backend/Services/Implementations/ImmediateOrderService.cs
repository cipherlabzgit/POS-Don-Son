using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.ImmediateOrders;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class ImmediateOrderService : IImmediateOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ImmediateOrderService> _logger;
    private readonly IOperationApprovalRecorder _approvalRecorder;
    private readonly IAutoApprovalConfigService _autoApprovalConfigService;

    public ImmediateOrderService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<ImmediateOrderService> logger,
        IOperationApprovalRecorder approvalRecorder,
        IAutoApprovalConfigService autoApprovalConfigService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _approvalRecorder = approvalRecorder;
        _autoApprovalConfigService = autoApprovalConfigService;
    }

    public async Task<(IEnumerable<ImmediateOrderListDto> orders, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? outletId = null,
        Guid? deliveryTurnId = null,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<ImmediateOrder>()
            .Include(io => io.DeliveryTurn)
            .Include(io => io.Outlet)
            .Include(io => io.Product)
            .AsQueryable();

        query = ApplyImmediateOrderViewerScope(query, viewerUserId, viewerIsSuperAdmin);

        if (fromDate.HasValue)
        {
            query = query.Where(io => io.OrderDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(io => io.OrderDate <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(io => io.Status == status);
        }

        if (outletId.HasValue)
        {
            query = query.Where(io => io.OutletId == outletId.Value);
        }

        if (deliveryTurnId.HasValue)
        {
            query = query.Where(io => io.DeliveryTurnId == deliveryTurnId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .OrderByDescending(io => io.OrderDate)
            .ThenBy(io => io.OrderNo)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(io => new ImmediateOrderListDto
            {
                Id = io.Id,
                OrderNo = io.OrderNo,
                OrderBillNo = io.OrderBillNo,
                OrderDate = io.OrderDate,
                NeedByDate = io.NeedByDate,
                NeedByTime = io.NeedByTime,
                DeliveryDate = io.DeliveryDate,
                DeliveryTime = io.DeliveryTime,
                ProductionStartingDate = io.ProductionStartingDate,
                ProductionStartingTime = io.ProductionStartingTime,
                RecipeRequestNumber = io.RecipeRequestNumber,
                DeliveryTurnId = io.DeliveryTurnId,
                DeliveryTurnName = io.DeliveryTurn!.Name,
                OutletId = io.OutletId,
                OutletName = io.Outlet!.Name,
                ProductId = io.ProductId,
                ProductName = io.Product!.Name,
                FullQuantity = io.FullQuantity,
                MiniQuantity = io.MiniQuantity,
                RequestedBy = io.RequestedBy,
                Status = io.Status,
                IsCustomized = io.IsCustomized,
                CreatedAt = io.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return (orders, totalCount);
    }

    public async Task<IEnumerable<ImmediateOrderListDto>> GetByDateAndTurnAsync(
        DateTime date,
        Guid turnId,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        date = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var baseQuery = _context.Set<ImmediateOrder>()
            .Include(io => io.DeliveryTurn)
            .Include(io => io.Outlet)
            .Include(io => io.Product)
            .Where(io => io.OrderDate.Date == date && io.DeliveryTurnId == turnId);

        var scoped = ApplyImmediateOrderViewerScope(baseQuery, viewerUserId, viewerIsSuperAdmin);

        var orders = await scoped
            .Select(io => new ImmediateOrderListDto
            {
                Id = io.Id,
                OrderNo = io.OrderNo,
                OrderBillNo = io.OrderBillNo,
                OrderDate = io.OrderDate,
                NeedByDate = io.NeedByDate,
                NeedByTime = io.NeedByTime,
                DeliveryDate = io.DeliveryDate,
                DeliveryTime = io.DeliveryTime,
                ProductionStartingDate = io.ProductionStartingDate,
                ProductionStartingTime = io.ProductionStartingTime,
                RecipeRequestNumber = io.RecipeRequestNumber,
                DeliveryTurnId = io.DeliveryTurnId,
                DeliveryTurnName = io.DeliveryTurn!.Name,
                OutletId = io.OutletId,
                OutletName = io.Outlet!.Name,
                ProductId = io.ProductId,
                ProductName = io.Product!.Name,
                FullQuantity = io.FullQuantity,
                MiniQuantity = io.MiniQuantity,
                RequestedBy = io.RequestedBy,
                Status = io.Status,
                IsCustomized = io.IsCustomized,
                CreatedAt = io.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return orders;
    }

    public async Task<ImmediateOrderDetailDto?> GetByIdAsync(
        Guid id,
        Guid? viewerUserId = null,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<ImmediateOrder>()
            .Include(io => io.DeliveryTurn)
            .Include(io => io.Outlet)
            .Include(io => io.Product)
            .FirstOrDefaultAsync(io => io.Id == id, cancellationToken);

        if (order == null)
        {
            return null;
        }

        if (viewerUserId.HasValue && !ViewerMayAccessOrder(order, viewerUserId.Value, viewerIsSuperAdmin))
        {
            return null;
        }

        return new ImmediateOrderDetailDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            OrderBillNo = order.OrderBillNo,
            OrderDate = order.OrderDate,
            NeedByDate = order.NeedByDate,
            NeedByTime = order.NeedByTime,
            DeliveryDate = order.DeliveryDate,
            DeliveryTime = order.DeliveryTime,
            ProductionStartingDate = order.ProductionStartingDate,
            ProductionStartingTime = order.ProductionStartingTime,
            RecipeRequestNumber = order.RecipeRequestNumber,
            DeliveryTurnId = order.DeliveryTurnId,
            DeliveryTurnName = order.DeliveryTurn!.Name,
            OutletId = order.OutletId,
            OutletName = order.Outlet!.Name,
            ProductId = order.ProductId,
            ProductName = order.Product!.Name,
            FullQuantity = order.FullQuantity,
            MiniQuantity = order.MiniQuantity,
            RequestedBy = order.RequestedBy,
            Reason = order.Reason,
            IsCustomized = order.IsCustomized,
            CustomizationNotes = order.CustomizationNotes,
            Status = order.Status,
            ApprovedBy = order.ApprovedBy,
            ApprovedAt = order.ApprovedAt,
            RejectionReason = order.RejectionReason,
            IsActive = order.IsActive,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            CreatedById = order.CreatedById,
            UpdatedById = order.UpdatedById
        };
    }

    public async Task<ImmediateOrderDetailDto> CreateAsync(
        CreateImmediateOrderDto dto,
        Guid userId,
        List<string> permissionCodes,
        CancellationToken cancellationToken = default)
    {
        await EnforceOutletForAssignedShowroomAsync(dto.OutletId, userId, cancellationToken);

        // Check auto-approval configuration
        var autoApprovalEnabled = await _autoApprovalConfigService.IsAutoApprovalEnabledAsync("dms:immediate-order", cancellationToken);
        var canAutoApprove = permissionCodes.Contains("*") || permissionCodes.Contains("immediate_order:auto-approve");
        var shouldAutoApprove = autoApprovalEnabled && canAutoApprove;

        var order = _mapper.Map<ImmediateOrder>(dto);
        order.Id = Guid.NewGuid();
        // OrderNo assigned in ApplicationDbContext (transaction-scoped advisory lock + max suffix).
        order.OrderNo = string.Empty;
        order.Status = shouldAutoApprove ? "Approved" : "Pending";
        order.CreatedById = userId;
        order.UpdatedById = userId;
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        if (shouldAutoApprove)
        {
            order.ApprovedBy = userId;
            order.ApprovedAt = DateTime.UtcNow;
        }

        _context.Set<ImmediateOrder>().Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Record the transition
        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ImmediateOrder",
            DocumentId = order.Id,
            DocumentNo = order.OrderNo,
            FromStatus = "Created",
            ToStatus = shouldAutoApprove ? "Approved" : "Pending",
            Action = shouldAutoApprove ? "AutoApproved" : "Created",
        }, userId, cancellationToken);

        _logger.LogInformation("Immediate order created: {OrderNo} for outlet {OutletId} with status {Status}", 
            order.OrderNo, order.OutletId, order.Status);

        return (await GetByIdAsync(order.Id, userId, viewerIsSuperAdmin: false, cancellationToken))!;
    }

    public async Task<ImmediateOrderDetailDto> SubmitForApprovalAsync(
        Guid id,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        // DEPRECATED: Auto-approval system eliminates the need for manual submission.
        // Entries are now created directly in Pending or Approved status.
        await Task.CompletedTask; // Suppress async warning
        throw new InvalidOperationException("Submit is deprecated. Entries are auto-approved or created in Pending status.");
    }

    public async Task<ImmediateOrderDetailDto> UpdateAsync(
        Guid id,
        UpdateImmediateOrderDto dto,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<ImmediateOrder>()
            .FirstOrDefaultAsync(io => io.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (!ViewerMayAccessOrder(order, userId, viewerIsSuperAdmin))
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (order.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending orders can be updated.");
        }

        await EnforceOutletForAssignedShowroomAsync(dto.OutletId, userId, cancellationToken);

        _mapper.Map(dto, order);
        order.UpdatedById = userId;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Immediate order updated: {OrderNo}", order.OrderNo);

        return (await GetByIdAsync(id, userId, viewerIsSuperAdmin, cancellationToken))!;
    }

    public async Task DeleteAsync(
        Guid id,
        Guid viewerUserId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<ImmediateOrder>()
            .FirstOrDefaultAsync(io => io.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (!ViewerMayAccessOrder(order, viewerUserId, viewerIsSuperAdmin))
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (order.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending orders can be deleted.");
        }

        order.IsActive = false;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Immediate order soft-deleted: {OrderNo}", order.OrderNo);
    }

    public async Task<ImmediateOrderDetailDto> ApproveAsync(
        Guid id,
        Guid approvedBy,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<ImmediateOrder>()
            .FirstOrDefaultAsync(io => io.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (!ViewerMayAccessOrder(order, approvedBy, viewerIsSuperAdmin))
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (order.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending orders can be approved.");
        }

        order.Status = "Approved";
        order.ApprovedBy = approvedBy;
        order.ApprovedAt = DateTime.UtcNow;
        order.UpdatedById = approvedBy;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ImmediateOrder",
            DocumentId   = order.Id,
            DocumentNo   = order.OrderNo,
            FromStatus   = "Pending",
            ToStatus     = "Approved",
            Action       = "Approved",
        }, approvedBy, cancellationToken);

        _logger.LogInformation("Immediate order approved: {OrderNo} by user {UserId}",
            order.OrderNo, approvedBy);

        return (await GetByIdAsync(id, approvedBy, viewerIsSuperAdmin, cancellationToken))!;
    }

    public async Task<ImmediateOrderDetailDto> RejectAsync(
        Guid id,
        string reason,
        Guid userId,
        bool viewerIsSuperAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Set<ImmediateOrder>()
            .FirstOrDefaultAsync(io => io.Id == id, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (!ViewerMayAccessOrder(order, userId, viewerIsSuperAdmin))
        {
            throw new InvalidOperationException($"Immediate order with ID '{id}' not found.");
        }

        if (order.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending orders can be rejected.");
        }

        order.Status = "Rejected";
        order.RejectionReason = reason;
        order.UpdatedById = userId;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _approvalRecorder.RecordTransitionAsync(new CreateOperationApprovalDto
        {
            DocumentType = "ImmediateOrder",
            DocumentId   = order.Id,
            DocumentNo   = order.OrderNo,
            FromStatus   = "Pending",
            ToStatus     = "Rejected",
            Action       = "Rejected",
            Remarks      = reason,
        }, userId, cancellationToken);

        _logger.LogInformation("Immediate order rejected: {OrderNo} by user {UserId}",
            order.OrderNo, userId);

        return (await GetByIdAsync(id, userId, viewerIsSuperAdmin, cancellationToken))!;
    }

    private static IQueryable<ImmediateOrder> ApplyImmediateOrderViewerScope(
        IQueryable<ImmediateOrder> query,
        Guid? viewerUserId,
        bool viewerIsSuperAdmin)
    {
        if (!viewerUserId.HasValue || viewerIsSuperAdmin)
            return query;
        return query.Where(io => io.CreatedById == viewerUserId.Value);
    }

    private static bool ViewerMayAccessOrder(ImmediateOrder order, Guid viewerUserId, bool viewerIsSuperAdmin)
    {
        if (viewerIsSuperAdmin)
            return true;
        return order.CreatedById == viewerUserId;
    }

    /// <summary>
    /// Users linked to a showroom via <see cref="OutletEmployee"/> may only submit orders for that outlet.
    /// Super admins are unrestricted.
    /// </summary>
    private async Task EnforceOutletForAssignedShowroomAsync(
        Guid requestedOutletId,
        Guid creatorUserId,
        CancellationToken cancellationToken)
    {
        var creator = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == creatorUserId, cancellationToken);
        if (creator == null)
            throw new InvalidOperationException("User not found.");

        if (creator.IsSuperAdmin)
            return;

        var assignment = await _context.OutletEmployees.AsNoTracking()
            .Where(oe => oe.UserId == creatorUserId && oe.IsActive)
            .OrderByDescending(oe => oe.IsManager)
            .ThenBy(oe => oe.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment == null)
            return;

        if (assignment.OutletId != requestedOutletId)
            throw new InvalidOperationException("You can only submit immediate orders for your assigned showroom.");
    }
}
