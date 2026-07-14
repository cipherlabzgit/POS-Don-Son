using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using Microsoft.Extensions.Configuration;
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

public sealed class StockBfReportService : IStockBfReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static StockBfReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public StockBfReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<StockBfReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default)
    {
        await EnsureReportDateAllowedAsync(reportDate, user, cancellationToken);

        var dayStart = reportDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var showrooms = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.Code)
            .Select(o => new StockBfReportOutletColumnDto
            {
                OutletId = o.Id,
                OutletCode = o.Code,
                OutletName = o.Name,
            })
            .ToListAsync(cancellationToken);

        var outletOrder = showrooms.Select((s, i) => (s.OutletId, Index: i)).ToDictionary(x => x.OutletId, x => x.Index);

        var bfLines = await _context.StockBFs
            .AsNoTracking()
            .Include(s => s.Product)
            .Where(s =>
                s.IsActive &&
                (s.Status == StockBFStatus.Approved || s.Status == StockBFStatus.Adjusted) &&
                s.BFDate >= dayStart &&
                s.BFDate < dayEnd)
            .ToListAsync(cancellationToken);

        var nCols = showrooms.Count;
        var byProduct = bfLines
            .Where(s => s.Product != null)
            .GroupBy(s => s.ProductId)
            .Select(g =>
            {
                var qtyByOutlet = new decimal[nCols];
                foreach (var line in g)
                {
                    if (!outletOrder.TryGetValue(line.OutletId, out var idx))
                        continue;
                    qtyByOutlet[idx] += line.Quantity;
                }

                var first = g.First();
                var p = first.Product!;
                return new StockBfReportRowDto
                {
                    RowNo = 0,
                    ProductCode = p.Code,
                    ProductName = p.Name,
                    Quantities = qtyByOutlet,
                    RowTotal = qtyByOutlet.Sum(),
                };
            })
            .OrderBy(r => r.ProductCode, StringComparer.OrdinalIgnoreCase)
            .Where(r => r.RowTotal != 0m)
            .ToList();

        for (var i = 0; i < byProduct.Count; i++)
            byProduct[i].RowNo = i + 1;

        var columnTotals = new decimal[nCols];
        foreach (var row in byProduct)
        {
            for (var c = 0; c < nCols; c++)
                columnTotals[c] += row.Quantities[c];
        }

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new StockBfReportDto
        {
            CompanyName = company,
            ReportDate = reportDate,
            GeneratedAtUtc = DateTime.UtcNow,
            Showrooms = showrooms,
            Rows = byProduct,
            Totals = new StockBfReportTotalsDto
            {
                ColumnTotals = columnTotals,
                GrandTotal = columnTotals.Sum(),
            },
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

    public byte[] RenderPdf(StockBfReportDto report)
    {
        using var stream = new MemoryStream();
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(7.5f));

                page.Header().Column(c =>
                {
                    c.Item().Text(report.CompanyName).SemiBold().FontSize(11);
                    c.Item().PaddingTop(3).Text(report.ReportTitle).Bold().FontSize(12);
                    c.Item().PaddingTop(2).Text($"BF date: {report.ReportDate:yyyy-MM-dd}")
                        .FontSize(9);
                    c.Item().Text($"Generated (UTC): {report.GeneratedAtUtc:yyyy-MM-dd HH:mm}")
                        .FontSize(7.5f)
                        .FontColor(Colors.Grey.Medium);
                    c.Item().PaddingTop(3).Text(
                            "Approved / adjusted Stock BF quantities by item and showroom (active outlets as columns).")
                        .FontSize(7f)
                        .Italic()
                        .FontColor(Colors.Grey.Darken1);
                });

                page.Content().PaddingTop(10).Element(content =>
                {
                    var showroomCount = report.Showrooms.Count;
                    if (showroomCount == 0)
                    {
                        content.Text("No active showrooms configured.").FontSize(9);
                        return;
                    }

                    content.Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(20);
                            columns.RelativeColumn(0.85f);
                            columns.RelativeColumn(1.35f);
                            for (var i = 0; i < showroomCount; i++)
                                columns.RelativeColumn(0.5f);
                            columns.RelativeColumn(0.55f);
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(3).PaddingHorizontal(2);

                        table.Header(header =>
                        {
                            static IContainer H(IContainer c) => CellStyle(c).Background(Colors.Grey.Lighten3);
                            header.Cell().Element(H).Text("#").Bold();
                            header.Cell().Element(H).Text("Code").Bold();
                            header.Cell().Element(H).Text("Item").Bold();
                            foreach (var sh in report.Showrooms)
                                header.Cell().Element(H).AlignRight().Text(sh.OutletCode).Bold();
                            header.Cell().Element(H).AlignRight().Text("Total").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.ProductCode);
                            table.Cell().Element(CellStyle).Text(r.ProductName);
                            for (var i = 0; i < showroomCount; i++)
                            {
                                var q = r.Quantities.Count > i ? r.Quantities[i] : 0m;
                                table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(q));
                            }

                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.RowTotal));
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(4).PaddingHorizontal(2);

                        table.Cell().ColumnSpan((uint)3).Element(TotalCell).Text("Totals").Bold();
                        for (var i = 0; i < showroomCount; i++)
                        {
                            var t = report.Totals.ColumnTotals.Count > i ? report.Totals.ColumnTotals[i] : 0m;
                            table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(t)).Bold();
                        }

                        table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(report.Totals.GrandTotal)).Bold();
                    });
                });

                page.Footer()
                    .AlignRight()
                    .DefaultTextStyle(TextStyle.Default.FontSize(7.5f).FontColor(Colors.Grey.Medium))
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

    public byte[] RenderExcel(StockBfReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Stock BF");

        var showroomCount = report.Showrooms.Count;
        var totalCols = Math.Max(4, 3 + showroomCount + 1);

        ws.Cell(1, 1).Value = report.CompanyName;
        ws.Range(1, 1, 1, totalCols).Merge();
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 13;

        ws.Cell(2, 1).Value = report.ReportTitle;
        ws.Range(2, 1, 2, totalCols).Merge();
        ws.Cell(2, 1).Style.Font.Bold = true;

        ws.Cell(3, 1).Value = "BF date:";
        ws.Cell(3, 2).Value = report.ReportDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        ws.Cell(4, 1).Value = "Generated (UTC):";
        ws.Cell(4, 2).Value = report.GeneratedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

        var headerRow = 6;
        var c0 = 1;
        ws.Cell(headerRow, c0++).Value = "#";
        ws.Cell(headerRow, c0++).Value = "Item code";
        ws.Cell(headerRow, c0++).Value = "Item name";
        foreach (var sh in report.Showrooms)
            ws.Cell(headerRow, c0++).Value = sh.OutletCode;
        ws.Cell(headerRow, c0).Value = "Total";

        for (var col = 1; col <= totalCols; col++)
        {
            ws.Cell(headerRow, col).Style.Font.Bold = true;
            ws.Cell(headerRow, col).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        var r = headerRow + 1;
        foreach (var row in report.Rows)
        {
            var col = 1;
            ws.Cell(r, col++).Value = row.RowNo;
            ws.Cell(r, col++).Value = row.ProductCode;
            ws.Cell(r, col++).Value = row.ProductName;
            for (var i = 0; i < showroomCount; i++)
            {
                var q = row.Quantities.Count > i ? row.Quantities[i] : 0m;
                ws.Cell(r, col++).Value = q;
            }

            ws.Cell(r, col).Value = row.RowTotal;
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 3).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        var colT = 4;
        for (var i = 0; i < showroomCount; i++)
        {
            var t = report.Totals.ColumnTotals.Count > i ? report.Totals.ColumnTotals[i] : 0m;
            ws.Cell(r, colT++).Value = t;
        }

        ws.Cell(r, colT).Value = report.Totals.GrandTotal;
        ws.Cell(r, colT).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.Bold = true;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var outStream = new MemoryStream();
        workbook.SaveAs(outStream);
        return outStream.ToArray();
    }

    private static string FmtQty(decimal v) =>
        v.ToString("0.####", CultureInfo.InvariantCulture);
}
