using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IDailyProductionReportService
{
    Task<DailyProductionReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(DailyProductionReportDto report);

    byte[] RenderExcel(DailyProductionReportDto report);
}
