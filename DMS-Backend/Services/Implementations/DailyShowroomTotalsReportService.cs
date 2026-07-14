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

public sealed class DailyShowroomTotalsReportService : IDailyShowroomTotalsReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static DailyShowroomTotalsReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DailyShowroomTotalsReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<DailyShowroomTotalsReportDto> BuildReportAsync(
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

        var sales = await _context.PosSales
            .AsNoTracking()
            .Where(s =>
                s.IsActive &&
                s.Status == PosSaleStatus.Approved &&
                s.SoldAt >= dayStart &&
                s.SoldAt < dayEnd)
            .Select(s => new { s.OutletId, s.TotalAmount, s.PaymentMethod })
            .ToListAsync(cancellationToken);

        var rows = new List<DailyShowroomTotalsReportRowDto>();
        foreach (var outlet in outlets)
        {
            var items = sales.Where(s => s.OutletId == outlet.Id).ToList();
            var billCount = items.Count;
            var total = items.Sum(x => x.TotalAmount);
            decimal cash = 0, card = 0, other = 0;
            foreach (var x in items)
            {
                var m = (x.PaymentMethod ?? string.Empty).Trim();
                if (string.Equals(m, "cash", StringComparison.OrdinalIgnoreCase))
                    cash += x.TotalAmount;
                else if (string.Equals(m, "card", StringComparison.OrdinalIgnoreCase))
                    card += x.TotalAmount;
                else
                    other += x.TotalAmount;
            }

            rows.Add(new DailyShowroomTotalsReportRowDto
            {
                OutletCode = outlet.Code,
                OutletName = outlet.Name,
                BillCount = billCount,
                TotalAmount = total,
                CashAmount = cash,
                CardAmount = card,
                OtherAmount = other,
            });
        }

        for (var i = 0; i < rows.Count; i++)
            rows[i].RowNo = i + 1;

        var totals = new DailyShowroomTotalsReportTotalsDto
        {
            TotalBills = rows.Sum(r => r.BillCount),
            TotalAmount = rows.Sum(r => r.TotalAmount),
            TotalCash = rows.Sum(r => r.CashAmount),
            TotalCard = rows.Sum(r => r.CardAmount),
            TotalOther = rows.Sum(r => r.OtherAmount),
        };

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new DailyShowroomTotalsReportDto
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

    public byte[] RenderPdf(DailyShowroomTotalsReportDto report)
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
                    c.Item().PaddingTop(4).Text("Approved POS sales grouped by showroom (bill count and payment mix).")
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
                            columns.RelativeColumn(0.85f);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(0.75f);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3);

                        table.Header(header =>
                        {
                            static IContainer H(IContainer c) => CellStyle(c).Background(Colors.Grey.Lighten3);
                            header.Cell().Element(H).Text("#").Bold();
                            header.Cell().Element(H).Text("Code").Bold();
                            header.Cell().Element(H).Text("Showroom").Bold();
                            header.Cell().Element(H).AlignRight().Text("Bills").Bold();
                            header.Cell().Element(H).AlignRight().Text("Total").Bold();
                            header.Cell().Element(H).AlignRight().Text("Cash").Bold();
                            header.Cell().Element(H).AlignRight().Text("Card").Bold();
                            header.Cell().Element(H).AlignRight().Text("Other").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.OutletCode);
                            table.Cell().Element(CellStyle).Text(r.OutletName);
                            table.Cell().Element(CellStyle).AlignRight().Text(r.BillCount.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.TotalAmount));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.CashAmount));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.CardAmount));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtMoney(r.OtherAmount));
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(5).PaddingHorizontal(3);

                        table.Cell().ColumnSpan(3).Element(TotalCell).Text("Totals").Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(report.Totals.TotalBills.ToString(CultureInfo.InvariantCulture)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalAmount)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalCash)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalCard)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtMoney(report.Totals.TotalOther)).Bold();
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

    public byte[] RenderExcel(DailyShowroomTotalsReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Showroom Totals");

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
            "#", "Showroom code", "Showroom", "Bills", "Total", "Cash", "Card", "Other",
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
            ws.Cell(r, 4).Value = row.BillCount;
            ws.Cell(r, 5).Value = row.TotalAmount;
            ws.Cell(r, 6).Value = row.CashAmount;
            ws.Cell(r, 7).Value = row.CardAmount;
            ws.Cell(r, 8).Value = row.OtherAmount;
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 3).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 4).Value = report.Totals.TotalBills;
        ws.Cell(r, 5).Value = report.Totals.TotalAmount;
        ws.Cell(r, 6).Value = report.Totals.TotalCash;
        ws.Cell(r, 7).Value = report.Totals.TotalCard;
        ws.Cell(r, 8).Value = report.Totals.TotalOther;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string FmtMoney(decimal v) =>
        v.ToString("N2", CultureInfo.InvariantCulture);
}
