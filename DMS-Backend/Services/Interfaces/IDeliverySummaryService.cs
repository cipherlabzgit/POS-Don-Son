using DMS_Backend.Models.DTOs.DeliverySummary;

namespace DMS_Backend.Services.Interfaces;

public interface IDeliverySummaryService
{
    /// <param name="context">"production" returns TotalQty (no freezer deduction). "stores" returns NetRequiredQty (TotalQty - FreezerBalance).</param>
    Task<DeliverySummaryDto?> GetDeliverySummaryAsync(DateTime date, Guid deliveryTurnId, string context = "production", CancellationToken cancellationToken = default);
}
