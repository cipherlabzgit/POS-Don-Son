using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IDailySaleReportService
{
    Task<IReadOnlyList<DailySaleReportShowroomOptionDto>> ListActiveShowroomsAsync(
        CancellationToken cancellationToken = default);

    Task<DailySaleReportDto> BuildReportAsync(
        Guid outletId,
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(DailySaleReportDto report);

    byte[] RenderExcel(DailySaleReportDto report);
}
