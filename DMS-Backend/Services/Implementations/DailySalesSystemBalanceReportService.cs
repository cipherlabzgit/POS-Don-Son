using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DMS_Backend.Services.Implementations;

public sealed class DailySalesSystemBalanceReportService : IDailySalesSystemBalanceReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static DailySalesSystemBalanceReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DailySalesSystemBalanceReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<DailySalesSystemBalanceReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default)
    {
        await EnsureReportDateAllowedAsync(reportDate, user, cancellationToken);

        var dayStart = reportDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var rawLines = await _context.PosSaleLines
            .AsNoTracking()
            .Include(l => l.Product)
            .Include(l => l.PosSale)
            .Where(l =>
                l.IsActive &&
                l.Product != null &&
                l.PosSale != null &&
                l.PosSale.IsActive &&
                l.PosSale.Status == PosSaleStatus.Approved &&
                l.PosSale.SoldAt >= dayStart &&
                l.PosSale.SoldAt < dayEnd)
            .ToListAsync(cancellationToken);

        var rows = rawLines
            .GroupBy(l => l.ProductId)
            .Select(g =>
            {
                var first = g.First();
                var p = first.Product;
                return new DailySalesSystemBalanceReportRowDto
                {
                    ProductCode = p?.Code ?? string.Empty,
                    ProductName = p?.Name ?? string.Empty,
                    TotalQuantity = g.Sum(x => x.Quantity),
                    TotalAmount = g.Sum(x => x.LineTotal),
                    LineCount = g.Count(),
                };
            })
            .OrderBy(r => r.ProductCode, StringComparer.OrdinalIgnoreCase)
            .ToList();

        for (var i = 0; i < rows.Count; i++)
            rows[i].RowNo = i + 1;

        var totals = new DailySalesSystemBalanceReportTotalsDto
        {
            TotalQuantity = rows.Sum(r => r.TotalQuantity),
            TotalAmount = rows.Sum(r => r.TotalAmount),
            TotalLines = rows.Sum(r => r.LineCount),
        };

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new DailySalesSystemBalanceReportDto
        {
            CompanyName = company,
            ReportDate = reportDate,
            GeneratedAtUtc = DateTime.UtcNow,
            Rows = rows,
            Totals = totals,
        };
    }

    private async Task EnsureReportDateAllowedAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (ReportDateFloorAuthorization.CanBypassReportDayEndFloor(user))
            return;

        var lastDayEnd = await _dayLockService.GetLastDayEndDateAsync(cancellationToken);
        if (!lastDayEnd.HasValue)
            return;

        var minDate = DateOnly.FromDateTime(lastDayEnd.Value.Date.AddDays(1));
        if (reportDate < minDate)
        {
            throw new InvalidOperationException(
                $"Report date must be on or after {minDate:yyyy-MM-dd} (day after the last Day-End Process).");
        }
    }

    public byte[] RenderPdf(DailySalesSystemBalanceReportDto report)
    {
        using var stream = new MemoryStream();
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(c =>
                {
                    c.Item().Text(report.CompanyName).SemiBold().FontSize(12);
                    c.Item().PaddingTop(4).Text(report.ReportTitle).Bold().FontSize(14);
                    c.Item().PaddingTop(2).Text($"Sales date: {report.ReportDate:yyyy-MM-dd}")
                        .FontSize(10);
                    c.Item().Text($"Generated (UTC): {report.GeneratedAtUtc:yyyy-MM-dd HH:mm}")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Medium);
                    c.Item().PaddingTop(4).Text("Approved POS sale lines aggregated by product (system totals).")
                        .FontSize(8)
                        .Italic()
                        .FontColor(Colors.Grey.Darken1);
                });

                page.Content().Column(content =>
                {
                    content.Item().PaddingTop(12).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(26);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(2.2f);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(0.75f);
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3);

                        table.Header(header =>
                        {
                            static IContainer H(IContainer c) => CellStyle(c).Background(Colors.Grey.Lighten3);
                            header.Cell().Element(H).Text("#").Bold();
                            header.Cell().Element(H).Text("Item code").Bold();
                            header.Cell().Element(H).Text("Item name").Bold();
                            header.Cell().Element(H).AlignRight().Text("Qty").Bold();
                            header.Cell().Element(H).AlignRight().Text("Amount").Bold();
                            header.Cell().Element(H).AlignRight().Text("Lines").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.ProductCode);
                            table.Cell().Element(CellStyle).Text(r.ProductName);
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.TotalQuantity));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.TotalAmount));
                            table.Cell().Element(CellStyle).AlignRight().Text(r.LineCount.ToString(CultureInfo.InvariantCulture));
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(5).PaddingHorizontal(3);

                        table.Cell().ColumnSpan(3).Element(TotalCell).Text("Totals").Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(report.Totals.TotalQuantity)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalAmount)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(report.Totals.TotalLines.ToString(CultureInfo.InvariantCulture)).Bold();
                    });
                });

                page.Footer()
                    .AlignRight()
                    .DefaultTextStyle(TextStyle.Default.FontSize(8).FontColor(Colors.Grey.Medium))
                    .Text(t =>
                    {
                        t.Span("Page ");
                        t.CurrentPageNumber();
                        t.Span(" / ");
                        t.TotalPages();
                    });
            });
        }).GeneratePdf(stream);

        return stream.ToArray();
    }

    public byte[] RenderExcel(DailySalesSystemBalanceReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("System Balance");

        ws.Cell(1, 1).Value = report.CompanyName;
        ws.Range(1, 1, 1, 6).Merge();
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        ws.Cell(2, 1).Value = report.ReportTitle;
        ws.Range(2, 1, 2, 6).Merge();
        ws.Cell(2, 1).Style.Font.Bold = true;

        ws.Cell(3, 1).Value = "Sales date:";
        ws.Cell(3, 2).Value = report.ReportDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        ws.Cell(4, 1).Value = "Generated (UTC):";
        ws.Cell(4, 2).Value = report.GeneratedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

        var headerRow = 6;
        var headers = new[] { "#", "Item code", "Item name", "Qty", "Amount", "Lines" };
        for (var c = 0; c < headers.Length; c++)
        {
            ws.Cell(headerRow, c + 1).Value = headers[c];
            ws.Cell(headerRow, c + 1).Style.Font.Bold = true;
            ws.Cell(headerRow, c + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        var r = headerRow + 1;
        foreach (var row in report.Rows)
        {
            ws.Cell(r, 1).Value = row.RowNo;
            ws.Cell(r, 2).Value = row.ProductCode;
            ws.Cell(r, 3).Value = row.ProductName;
            ws.Cell(r, 4).Value = row.TotalQuantity;
            ws.Cell(r, 5).Value = row.TotalAmount;
            ws.Cell(r, 6).Value = row.LineCount;
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 3).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 4).Value = report.Totals.TotalQuantity;
        ws.Cell(r, 5).Value = report.Totals.TotalAmount;
        ws.Cell(r, 6).Value = report.Totals.TotalLines;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string FmtMoney(decimal v) =>
        v.ToString("N2", CultureInfo.InvariantCulture);

    private static string FmtQty(decimal v) =>
        v.ToString("0.####", CultureInfo.InvariantCulture);
}
