using System.Security.Claims;
using DMS_Backend.Models.DTOs.Reports;

namespace DMS_Backend.Services.Interfaces;

public interface IStockBfReportService
{
    Task<StockBfReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default);

    byte[] RenderPdf(StockBfReportDto report);

    byte[] RenderExcel(StockBfReportDto report);
}
