using DMS_Backend.Models.DTOs.DashboardStats;

namespace DMS_Backend.Services.Interfaces;

public interface IDashboardStatsService
{
    Task<SalesTrendDto> GetSalesTrendAsync(int days, CancellationToken cancellationToken = default);
    Task<DisposalBySectionDto> GetDisposalBySectionAsync(DateTime date, CancellationToken cancellationToken = default);
    Task<TopDeliveriesDto> GetTopDeliveriesAsync(DateTime date, CancellationToken cancellationToken = default);
    Task<DeliveryVsDisposalDto> GetDeliveryVsDisposalAsync(int days, CancellationToken cancellationToken = default);

    /// <summary>Returns section-wise production quantity totals for a delivery plan date and optional turn.</summary>
    Task<SectionProductionSummaryDto> GetSectionProductionTotalsAsync(DateTime date, Guid? deliveryTurnId = null, CancellationToken cancellationToken = default);

    /// <summary>Returns all ingredients with low-stock or reorder alerts enabled.</summary>
    Task<IngredientStockAlertSummaryDto> GetIngredientStockAlertsAsync(CancellationToken cancellationToken = default);
}
