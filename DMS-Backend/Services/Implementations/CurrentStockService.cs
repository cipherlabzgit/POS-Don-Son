using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.CurrentStock;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

/// <summary>
/// Service for computing current stock positions on-demand.
/// CurrentStock is NOT a stored entity - it's computed from multiple sources.
/// 
/// Computation Logic:
/// Today Balance = 
///   OpenBalance (from StockBF for latest date)
///   + TodayProduction (from DailyProduction where Status = Approved)
///   - TodayProductionCancelled (from ProductionCancel where Status = Approved)
///   - TodayDelivery (from Delivery where Status = Approved)
///   + DeliveryCancelled (from Cancellation where Status = Approved)
///   + DeliveryReturned (from DeliveryReturn where Status = Approved)
///   + StockAdjustments (from StockAdjustment where Status = Approved)
/// </summary>
public class CurrentStockService : ICurrentStockService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CurrentStockService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<CurrentStockDto>> GetAllAsync(DateTime? forDate = null, CancellationToken cancellationToken = default)
    {
        var targetDate = forDate ?? DateTime.UtcNow.Date;

        var products = await _context.Products
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

        var stockDtos = new List<CurrentStockDto>();

        foreach (var product in products)
        {
            var stockDto = await ComputeStockForProductAsync(product.Id, targetDate, cancellationToken);
            if (stockDto != null)
            {
                stockDto.ProductCode = product.Code;
                stockDto.ProductName = product.Name;
                stockDtos.Add(stockDto);
            }
        }

        return stockDtos;
    }

    public async Task<CurrentStockDto?> GetByProductIdAsync(Guid productId, DateTime? forDate = null, CancellationToken cancellationToken = default)
    {
        var targetDate = forDate ?? DateTime.UtcNow.Date;

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, cancellationToken);

        if (product == null)
            return null;

        var stockDto = await ComputeStockForProductAsync(productId, targetDate, cancellationToken);
        if (stockDto != null)
        {
            stockDto.ProductCode = product.Code;
            stockDto.ProductName = product.Name;
        }

        return stockDto;
    }

    private async Task<CurrentStockDto?> ComputeStockForProductAsync(Guid productId, DateTime targetDate, CancellationToken cancellationToken)
    {
        // 1. Get Open Balance from latest StockBF
        var openBalance = await _context.StockBFs
            .Where(s => s.ProductId == productId && s.BFDate <= targetDate && s.IsActive)
            .OrderByDescending(s => s.BFDate)
            .Select(s => s.Quantity)
            .FirstOrDefaultAsync(cancellationToken);

        // 2. Get Today's Production (Approved)
        var todayProduction = await _context.DailyProductions
            .Where(d => d.ProductId == productId 
                && d.ProductionDate.Date == targetDate.Date 
                && d.Status == Models.Entities.DailyProductionStatus.Approved 
                && d.IsActive)
            .SumAsync(d => (decimal?)d.ProducedQty, cancellationToken) ?? 0;

        // 3. Get Today's Production Cancelled (Approved)
        var todayProductionCancelled = await _context.ProductionCancelLines
            .Where(l => l.ProductId == productId
                && l.ProductionCancel.CancelDate.Date == targetDate.Date
                && l.ProductionCancel.Status == Models.Entities.ProductionCancelStatus.Approved
                && l.ProductionCancel.IsActive
                && l.IsActive)
            .SumAsync(l => (decimal?)l.CancelledQty, cancellationToken) ?? 0;

        // 4. Get Today's Delivery (Approved)
        var todayDelivery = await _context.DeliveryItems
            .Where(di => di.Product.Id == productId 
                && di.Delivery.DeliveryDate.Date == targetDate.Date 
                && di.Delivery.Status == Models.Entities.DeliveryStatus.Approved 
                && di.IsActive)
            .SumAsync(di => (decimal?)di.Quantity, cancellationToken) ?? 0;

        // 5. Get Delivery Cancelled (Approved) for today
        // Note: Cancellations are at delivery level, so we sum the DeliveryItems quantities for cancelled deliveries
        var cancelledDeliveryNos = await _context.Cancellations
            .Where(c => c.CancellationDate.Date == targetDate.Date 
                && c.Status == Models.Entities.CancellationStatus.Approved 
                && c.IsActive)
            .Select(c => c.DeliveryNo)
            .ToListAsync(cancellationToken);

        var deliveryCancelled = await _context.DeliveryItems
            .Where(di => di.Product.Id == productId 
                && cancelledDeliveryNos.Contains(di.Delivery.DeliveryNo)
                && di.IsActive)
            .SumAsync(di => (decimal?)di.Quantity, cancellationToken) ?? 0;

        // 6. Get Delivery Returned (Approved) for today
        var deliveryReturned = await _context.DeliveryReturnItems
            .Where(dr => dr.Product.Id == productId 
                && dr.DeliveryReturn.ReturnDate.Date == targetDate.Date 
                && dr.DeliveryReturn.Status == Models.Entities.DeliveryReturnStatus.Approved 
                && dr.IsActive)
            .SumAsync(dr => (decimal?)dr.Quantity, cancellationToken) ?? 0;

        // 7. Get Stock Adjustments (Approved) up to target date
        var stockAdjustmentsIncrease = await _context.StockAdjustments
            .Where(s => s.ProductId == productId 
                && s.AdjustmentDate.Date <= targetDate.Date 
                && s.Status == Models.Entities.StockAdjustmentStatus.Approved 
                && s.AdjustmentType == Models.Entities.StockAdjustmentType.Increase 
                && s.IsActive)
            .SumAsync(s => (decimal?)s.Quantity, cancellationToken) ?? 0;

        var stockAdjustmentsDecrease = await _context.StockAdjustments
            .Where(s => s.ProductId == productId 
                && s.AdjustmentDate.Date <= targetDate.Date 
                && s.Status == Models.Entities.StockAdjustmentStatus.Approved 
                && s.AdjustmentType == Models.Entities.StockAdjustmentType.Decrease 
                && s.IsActive)
            .SumAsync(s => (decimal?)s.Quantity, cancellationToken) ?? 0;

        var stockAdjustments = stockAdjustmentsIncrease - stockAdjustmentsDecrease;

        // Calculate Today Balance
        var todayBalance = openBalance 
            + todayProduction 
            - todayProductionCancelled 
            - todayDelivery 
            + deliveryCancelled 
            + deliveryReturned 
            + stockAdjustments;

        return new CurrentStockDto
        {
            ProductId = productId,
            ProductCode = string.Empty, // Will be set by caller
            ProductName = string.Empty, // Will be set by caller
            OpenBalance = openBalance,
            TodayProduction = todayProduction,
            TodayProductionCancelled = todayProductionCancelled,
            TodayDelivery = todayDelivery,
            DeliveryCancelled = deliveryCancelled,
            DeliveryReturned = deliveryReturned,
            StockAdjustments = stockAdjustments,
            TodayBalance = todayBalance
        };
    }
}
