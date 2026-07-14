using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IDailySaleOfItemReportService
{
    Task<IReadOnlyList<DailySaleOfItemProductOptionDto>> SearchProductsAsync(
        string? search,
        int take,
        CancellationToken cancellationToken = default);

    Task<DailySaleOfItemReportDto> BuildReportAsync(
        Guid productId,
        DateOnly fromDate,
        DateOnly toDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(DailySaleOfItemReportDto report);

    byte[] RenderExcel(DailySaleOfItemReportDto report);
}
