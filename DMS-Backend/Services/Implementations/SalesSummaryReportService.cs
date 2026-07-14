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

public sealed class SalesSummaryReportService : ISalesSummaryReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static SalesSummaryReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public SalesSummaryReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<SalesSummaryReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default)
    {
        await EnsureReportDateAllowedAsync(reportDate, user, cancellationToken);

        var dayStart = reportDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var outlets = await _context.Outlets
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderBy(o => o.DisplayOrder)
            .ThenBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var cashierByOutlet = await _context.CashierBalanceOutletLines
            .AsNoTracking()
            .Where(l => l.ProcessDate == dayStart)
            .ToDictionaryAsync(l => l.OutletId, cancellationToken);

        var systemTotals = await _context.PosSales
            .AsNoTracking()
            .Where(s =>
                s.IsActive &&
                s.Status == PosSaleStatus.Approved &&
                s.SoldAt >= dayStart &&
                s.SoldAt < dayEnd)
            .GroupBy(s => s.OutletId)
            .Select(g => new { OutletId = g.Key, Total = g.Sum(s => s.TotalAmount) })
            .ToListAsync(cancellationToken);

        var systemLookup = systemTotals.ToDictionary(x => x.OutletId, x => x.Total);

        var rows = new List<SalesSummaryReportRowDto>();
        foreach (var outlet in outlets)
        {
            cashierByOutlet.TryGetValue(outlet.Id, out var cbLine);
            var closed = cbLine?.IsShowroomClosed ?? false;
            decimal? cashierSale = null;
            if (!closed && cbLine?.CashierBalance is { } cb)
                cashierSale = cb;

            var systemSale = systemLookup.GetValueOrDefault(outlet.Id, 0m);
            decimal? difference = cashierSale is { } c ? c - systemSale : null;

            rows.Add(new SalesSummaryReportRowDto
            {
                OutletCode = outlet.Code,
                OutletName = outlet.Name,
                IsShowroomClosed = closed,
                CashierShowroomSale = cashierSale,
                SystemSale = systemSale,
                Difference = difference,
            });
        }

        for (var i = 0; i < rows.Count; i++)
            rows[i].RowNo = i + 1;

        var cashierSum = rows.Where(r => r.CashierShowroomSale.HasValue).Sum(r => r.CashierShowroomSale!.Value);
        var cashierCount = rows.Count(r => r.CashierShowroomSale.HasValue);
        var diffSum = rows.Where(r => r.Difference.HasValue).Sum(r => r.Difference!.Value);

        var totals = new SalesSummaryReportTotalsDto
        {
            TotalCashierShowroomSale = cashierCount > 0 ? cashierSum : null,
            TotalSystemSale = rows.Sum(r => r.SystemSale),
            TotalDifference = rows.Any(r => r.Difference.HasValue) ? diffSum : null,
        };

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new SalesSummaryReportDto
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

    public byte[] RenderPdf(SalesSummaryReportDto report)
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
                    c.Item().PaddingTop(4).Text("Showroom cashier total vs approved POS (system) totals.")
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
                            columns.RelativeColumn(0.9f);
                            columns.RelativeColumn(1.6f);
                            columns.RelativeColumn(0.85f);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(0.9f);
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3);

                        table.Header(header =>
                        {
                            static IContainer H(IContainer c) => CellStyle(c).Background(Colors.Grey.Lighten3);
                            header.Cell().Element(H).Text("#").Bold();
                            header.Cell().Element(H).Text("Code").Bold();
                            header.Cell().Element(H).Text("Showroom").Bold();
                            header.Cell().Element(H).Text("Closed").Bold();
                            header.Cell().Element(H).AlignRight().Text("Showroom sale").Bold();
                            header.Cell().Element(H).AlignRight().Text("System sale").Bold();
                            header.Cell().Element(H).AlignRight().Text("Difference").Bold();
                            header.Cell().Element(H).Text("Note").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.OutletCode);
                            table.Cell().Element(CellStyle).Text(r.OutletName);
                            table.Cell().Element(CellStyle).Text(r.IsShowroomClosed ? "Y" : "");
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.CashierShowroomSale));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.SystemSale));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.Difference));
                            table.Cell().Element(CellStyle).Text(RowNote(r));
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(5).PaddingHorizontal(3);

                        table.Cell().ColumnSpan(4).Element(TotalCell).Text("Totals").Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalCashierShowroomSale)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalSystemSale)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalDifference)).Bold();
                        table.Cell().Element(TotalCell).Text(string.Empty);
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

    public byte[] RenderExcel(SalesSummaryReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Sales Summary");

        ws.Cell(1, 1).Value = report.CompanyName;
        ws.Range(1, 1, 1, 8).Merge();
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        ws.Cell(2, 1).Value = report.ReportTitle;
        ws.Range(2, 1, 2, 8).Merge();
        ws.Cell(2, 1).Style.Font.Bold = true;

        ws.Cell(3, 1).Value = "Sales date:";
        ws.Cell(3, 2).Value = report.ReportDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        ws.Cell(4, 1).Value = "Generated (UTC):";
        ws.Cell(4, 2).Value = report.GeneratedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

        var headerRow = 6;
        var headers = new[]
        {
            "#", "Showroom code", "Showroom", "Closed", "Showroom sale", "System sale", "Difference", "Note",
        };
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
            ws.Cell(r, 2).Value = row.OutletCode;
            ws.Cell(r, 3).Value = row.OutletName;
            ws.Cell(r, 4).Value = row.IsShowroomClosed ? "Y" : "";
            ws.Cell(r, 5).Value = row.CashierShowroomSale;
            ws.Cell(r, 6).Value = row.SystemSale;
            ws.Cell(r, 7).Value = row.Difference;
            ws.Cell(r, 8).Value = RowNote(row);
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 4).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 5).Value = report.Totals.TotalCashierShowroomSale;
        ws.Cell(r, 6).Value = report.Totals.TotalSystemSale;
        ws.Cell(r, 7).Value = report.Totals.TotalDifference;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string RowNote(SalesSummaryReportRowDto r)
    {
        if (r.IsShowroomClosed)
            return "Showroom closed";
        if (!r.CashierShowroomSale.HasValue)
            return "No cashier total";
        return string.Empty;
    }

    private static string FmtMoney(decimal? v) =>
        v.HasValue ? v.Value.ToString("N2", CultureInfo.InvariantCulture) : "—";

    private static string FmtMoney(decimal v) =>
        v.ToString("N2", CultureInfo.InvariantCulture);
}
