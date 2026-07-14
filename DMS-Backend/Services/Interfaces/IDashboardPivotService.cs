using DMS_Backend.Models.DTOs.DashboardPivot;

namespace DMS_Backend.Services.Interfaces;

public interface IDashboardPivotService
{
    Task<DashboardPivotDto> GetDashboardPivotAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);
}
