using DMS_Backend.Models.DTOs.CashierBalance;
using DMS_Backend.Models.DTOs.DayEnd;

namespace DMS_Backend.Services.Interfaces;

public interface ICashierBalanceService
{
    Task<CashierBalanceContextDto> GetContextAsync(DateTime processDate, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DayEndCashierOptionDto>> GetCashiersForOutletAsync(Guid outletId, CancellationToken cancellationToken = default);

    Task SubmitAsync(SubmitCashierBalanceDto dto, Guid submittedByUserId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CashierBalanceRecentSubmissionDto>> GetRecentSubmissionsAsync(int count, CancellationToken cancellationToken = default);
}
