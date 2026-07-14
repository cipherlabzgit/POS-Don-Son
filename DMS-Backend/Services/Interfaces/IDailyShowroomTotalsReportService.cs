using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IDailyShowroomTotalsReportService
{
    Task<DailyShowroomTotalsReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(DailyShowroomTotalsReportDto report);

    byte[] RenderExcel(DailyShowroomTotalsReportDto report);
}
