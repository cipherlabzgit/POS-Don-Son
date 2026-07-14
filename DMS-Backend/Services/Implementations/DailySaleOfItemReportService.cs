using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DMS_Backend.Services.Implementations;

public sealed class DailySaleOfItemReportService : IDailySaleOfItemReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";
    private const int MaxRangeDays = 366;

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static DailySaleOfItemReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DailySaleOfItemReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<DailySaleOfItemProductOptionDto>> SearchProductsAsync(
        string? search,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 50);
        var term = search?.Trim();
        if (string.IsNullOrEmpty(term) || term.Length < 2)
            return Array.Empty<DailySaleOfItemProductOptionDto>();

        var lowered = term.ToLowerInvariant();
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && (p.Code.ToLower().Contains(lowered) || p.Name.ToLower().Contains(lowered)))
            .OrderBy(p => p.Code)
            .Take(take)
            .Select(p => new DailySaleOfItemProductOptionDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DailySaleOfItemReportDto> BuildReportAsync(
        Guid productId,
        DateOnly fromDate,
        DateOnly toDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default)
    {
        if (fromDate > toDate)
            throw new InvalidOperationException("From date must be on or before To date.");

        var daySpan = toDate.DayNumber - fromDate.DayNumber + 1;
        if (daySpan > MaxRangeDays)
            throw new InvalidOperationException($"Date range cannot exceed {MaxRangeDays} days.");

        await EnsureReportDateRangeAllowedAsync(fromDate, toDate, user, cancellationToken);

        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, cancellationToken);
        if (product == null)
            throw new InvalidOperationException("Product not found or inactive.");

        var rangeStart = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var rangeEndExclusive = toDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).AddDays(1);

        var rawLines = await _context.PosSaleLines
            .AsNoTracking()
            .Include(l => l.PosSale)
            .Where(l =>
                l.IsActive &&
                l.ProductId == productId &&
                l.PosSale != null &&
                l.PosSale.IsActive &&
                l.PosSale.Status == PosSaleStatus.Approved &&
                l.PosSale.SoldAt >= rangeStart &&
                l.PosSale.SoldAt < rangeEndExclusive)
            .ToListAsync(cancellationToken);

        var byDay = rawLines
            .GroupBy(l => DateOnly.FromDateTime(l.PosSale!.SoldAt.ToUniversalTime()))
            .ToDictionary(
                g => g.Key,
                g => (
                    Qty: g.Sum(x => x.Quantity),
                    Amt: g.Sum(x => x.LineTotal),
                    Lines: g.Count()));

        var rows = new List<DailySaleOfItemReportRowDto>();
        for (var d = fromDate; d <= toDate; d = d.AddDays(1))
        {
            byDay.TryGetValue(d, out var agg);
            rows.Add(new DailySaleOfItemReportRowDto
            {
                RowNo = rows.Count + 1,
                SaleDate = d,
                TotalQuantity = agg.Qty,
                TotalAmount = agg.Amt,
                LineCount = agg.Lines,
            });
        }

        var totals = new DailySaleOfItemReportTotalsDto
        {
            TotalQuantity = rows.Sum(r => r.TotalQuantity),
            TotalAmount = rows.Sum(r => r.TotalAmount),
            TotalLines = rows.Sum(r => r.LineCount),
        };

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new DailySaleOfItemReportDto
        {
            CompanyName = company,
            ProductId = product.Id,
            ProductCode = product.Code,
            ProductName = product.Name,
            FromDate = fromDate,
            ToDate = toDate,
            GeneratedAtUtc = DateTime.UtcNow,
            Rows = rows,
            Totals = totals,
        };
    }

    private async Task EnsureReportDateRangeAllowedAsync(
        DateOnly fromDate,
        DateOnly toDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (ReportDateFloorAuthorization.CanBypassReportDayEndFloor(user))
            return;

        var lastDayEnd = await _dayLockService.GetLastDayEndDateAsync(cancellationToken);
        if (!lastDayEnd.HasValue)
            return;

        var minDate = DateOnly.FromDateTime(lastDayEnd.Value.Date.AddDays(1));
        if (fromDate < minDate || toDate < minDate)
        {
            throw new InvalidOperationException(
                $"Report dates must be on or after {minDate:yyyy-MM-dd} (day after the last Day-End Process).");
        }
    }

    public byte[] RenderPdf(DailySaleOfItemReportDto report)
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
                    c.Item().PaddingTop(2).Text($"{report.ProductCode} — {report.ProductName}")
                        .FontSize(10);
                    c.Item().PaddingTop(2).Text(
                            $"Date range: {report.FromDate:yyyy-MM-dd} to {report.ToDate:yyyy-MM-dd} (UTC calendar days)")
                        .FontSize(10);
                    c.Item().Text($"Generated (UTC): {report.GeneratedAtUtc:yyyy-MM-dd HH:mm}")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Medium);
                    c.Item().PaddingTop(4).Text(
                            "Approved POS sale lines for this item, one row per day (zeros where no sales).")
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
                            columns.ConstantColumn(28);
                            columns.RelativeColumn(1.1f);
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
                            header.Cell().Element(H).Text("Date").Bold();
                            header.Cell().Element(H).AlignRight().Text("Qty").Bold();
                            header.Cell().Element(H).AlignRight().Text("Amount").Bold();
                            header.Cell().Element(H).AlignRight().Text("Lines").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.SaleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.TotalQuantity));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.TotalAmount));
                            table.Cell().Element(CellStyle).AlignRight().Text(r.LineCount.ToString(CultureInfo.InvariantCulture));
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(5).PaddingHorizontal(3);

                        table.Cell().ColumnSpan((uint)2).Element(TotalCell).Text("Totals").Bold();
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

    public byte[] RenderExcel(DailySaleOfItemReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Daily Sale Of Item");

        ws.Cell(1, 1).Value = report.CompanyName;
        ws.Range(1, 1, 1, 5).Merge();
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        ws.Cell(2, 1).Value = report.ReportTitle;
        ws.Range(2, 1, 2, 5).Merge();
        ws.Cell(2, 1).Style.Font.Bold = true;

        ws.Cell(3, 1).Value = "Item:";
        ws.Cell(3, 2).Value = $"{report.ProductCode} — {report.ProductName}";
        ws.Range(3, 2, 3, 5).Merge();

        ws.Cell(4, 1).Value = "From:";
        ws.Cell(4, 2).Value = report.FromDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        ws.Cell(4, 3).Value = "To:";
        ws.Cell(4, 4).Value = report.ToDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        ws.Cell(5, 1).Value = "Generated (UTC):";
        ws.Cell(5, 2).Value = report.GeneratedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

        var headerRow = 7;
        var headers = new[] { "#", "Date", "Qty", "Amount", "Lines" };
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
            ws.Cell(r, 2).Value = row.SaleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 3).Value = row.TotalQuantity;
            ws.Cell(r, 4).Value = row.TotalAmount;
            ws.Cell(r, 5).Value = row.LineCount;
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 2).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 3).Value = report.Totals.TotalQuantity;
        ws.Cell(r, 4).Value = report.Totals.TotalAmount;
        ws.Cell(r, 5).Value = report.Totals.TotalLines;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var outStream = new MemoryStream();
        workbook.SaveAs(outStream);
        return outStream.ToArray();
    }

    private static string FmtMoney(decimal v) =>
        v.ToString("N2", CultureInfo.InvariantCulture);

    private static string FmtQty(decimal v) =>
        v.ToString("0.####", CultureInfo.InvariantCulture);
}
