using DMS_Backend.Models.DTOs.Orders;

namespace DMS_Backend.Services.Interfaces;

public interface IOrderService
{
    Task<(IEnumerable<OrderListDto> orders, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        Guid? deliveryPlanId = null,
        bool customOrdersOnly = false,
        CancellationToken cancellationToken = default);

    Task<OrderDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<OrderDetailDto?> GetByOrderNoAsync(string orderNo, CancellationToken cancellationToken = default);

    Task<IEnumerable<OrderListDto>> GetByDateAndTurnAsync(
        DateTime date,
        Guid turnId,
        CancellationToken cancellationToken = default);

    Task<OrderDetailDto> CreateAsync(
        CreateOrderDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<OrderDetailDto> UpdateAsync(
        Guid id,
        UpdateOrderDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<OrderDetailDto> SubmitAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<OrderItemDto>> BulkUpsertItemsAsync(
        Guid orderId,
        List<BulkUpsertOrderItemDto> items,
        Guid userId,
        CancellationToken cancellationToken = default);
}
