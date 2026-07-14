using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IDailySalesSystemBalanceReportService
{
    Task<DailySalesSystemBalanceReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(DailySalesSystemBalanceReportDto report);

    byte[] RenderExcel(DailySalesSystemBalanceReportDto report);
}
