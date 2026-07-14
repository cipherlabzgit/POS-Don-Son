using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface ISalesSummaryReportService
{
    Task<SalesSummaryReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(SalesSummaryReportDto report);

    byte[] RenderExcel(SalesSummaryReportDto report);
}
