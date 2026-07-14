using DMS_Backend.Models.DTOs.DayEnd;

namespace DMS_Backend.Services.Interfaces;

public interface IDayEndService
{
    Task<DayEndContextDto> GetContextAsync(DateTime processDate, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DayEndCashierOptionDto>> GetCashiersForOutletAsync(Guid outletId, CancellationToken cancellationToken = default);

    Task ApproveCashierBalanceForDateAsync(DateTime processDate, Guid approvedByUserId, CancellationToken cancellationToken = default);

    Task SubmitDayEndAsync(SubmitDayEndDto dto, Guid submittedByUserId, CancellationToken cancellationToken = default);
}
