using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Reports;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DMS_Backend.Services.Implementations;

public sealed class DailyProductionReportService : IDailyProductionReportService
{
    private const string DefaultCompanyName = "Don & Sons (Pvt) Ltd";

    private readonly ApplicationDbContext _context;
    private readonly IDayLockService _dayLockService;
    private readonly IConfiguration _configuration;

    static DailyProductionReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public DailyProductionReportService(
        ApplicationDbContext context,
        IDayLockService dayLockService,
        IConfiguration configuration)
    {
        _context = context;
        _dayLockService = dayLockService;
        _configuration = configuration;
    }

    public async Task<DailyProductionReportDto> BuildReportAsync(
        DateOnly reportDate,
        ClaimsPrincipal user,
        CancellationToken cancellationToken = default)
    {
        await EnsureReportDateAllowedAsync(reportDate, user, cancellationToken);

        var dayStart = reportDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var lines = await _context.DailyProductions
            .AsNoTracking()
            .Where(d => d.IsActive)
            .Where(d => d.ProductionDate >= dayStart && d.ProductionDate < dayEnd)
            .Include(d => d.Product)
            .Include(d => d.ProductionSection)
            .ToListAsync(cancellationToken);

        var rows = lines
            .GroupBy(d => d.ProductId)
            .Select(g =>
            {
                var first = g.First();
                var product = first.Product;
                var sections = g
                    .Select(x => x.ProductionSection?.Name)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Distinct()
                    .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
                    .ToList();
                var sectionText = sections.Count switch
                {
                    0 => "—",
                    1 => sections[0]!,
                    _ => string.Join(", ", sections),
                };

                var statuses = g.Select(x => x.Status.ToString()).Distinct().OrderBy(x => x).ToList();
                var statusSummary = statuses.Count == 1 ? statuses[0] : "Mixed";

                var planned = g.Sum(x => x.PlannedQty);
                var produced = g.Sum(x => x.ProducedQty);

                return new DailyProductionReportRowDto
                {
                    ProductCode = product?.Code ?? string.Empty,
                    ProductName = product?.Name ?? string.Empty,
                    Sections = sectionText,
                    PlannedQty = planned,
                    ProducedQty = produced,
                    VarianceQty = produced - planned,
                    StatusSummary = statusSummary,
                    LineCount = g.Count(),
                };
            })
            .OrderBy(r => r.ProductCode, StringComparer.OrdinalIgnoreCase)
            .ToList();

        for (var i = 0; i < rows.Count; i++)
            rows[i].RowNo = i + 1;

        var totals = new DailyProductionReportTotalsDto
        {
            TotalPlannedQty = rows.Sum(r => r.PlannedQty),
            TotalProducedQty = rows.Sum(r => r.ProducedQty),
            TotalVarianceQty = rows.Sum(r => r.VarianceQty),
        };

        var company = _configuration["Reports:CompanyName"]?.Trim();
        if (string.IsNullOrEmpty(company))
            company = DefaultCompanyName;

        return new DailyProductionReportDto
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

    public byte[] RenderPdf(DailyProductionReportDto report)
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
                    c.Item().PaddingTop(2).Text($"Production date: {report.ReportDate:yyyy-MM-dd}")
                        .FontSize(10);
                    c.Item().Text($"Generated (Sri Lanka): {SriLankaDisplayTime.FormatUtcInstant(report.GeneratedAtUtc)}")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Medium);
                });

                page.Content().Column(content =>
                {
                    content.Item().PaddingTop(12).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(28);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(2.4f);
                            columns.RelativeColumn(1.8f);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(0.9f);
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3);

                        table.Header(header =>
                        {
                            static IContainer H(IContainer c) => CellStyle(c).Background(Colors.Grey.Lighten3);
                            header.Cell().Element(H).Text("#").Bold();
                            header.Cell().Element(H).Text("Item code").Bold();
                            header.Cell().Element(H).Text("Item name").Bold();
                            header.Cell().Element(H).Text("Section(s)").Bold();
                            header.Cell().Element(H).AlignRight().Text("Planned").Bold();
                            header.Cell().Element(H).AlignRight().Text("Produced").Bold();
                            header.Cell().Element(H).AlignRight().Text("Variance").Bold();
                            header.Cell().Element(H).Text("Status").Bold();
                        });

                        foreach (var r in report.Rows)
                        {
                            table.Cell().Element(CellStyle).Text(r.RowNo.ToString(CultureInfo.InvariantCulture));
                            table.Cell().Element(CellStyle).Text(r.ProductCode);
                            table.Cell().Element(CellStyle).Text(r.ProductName);
                            table.Cell().Element(CellStyle).Text(Truncate(r.Sections, 48));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.PlannedQty));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.ProducedQty));
                            table.Cell().Element(CellStyle).AlignRight().Text(FmtQty(r.VarianceQty));
                            table.Cell().Element(CellStyle).Text(r.StatusSummary);
                        }

                        static IContainer TotalCell(IContainer c) =>
                            c.BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingVertical(5).PaddingHorizontal(3);

                        table.Cell().ColumnSpan(4).Element(TotalCell).Text("Totals").Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(report.Totals.TotalPlannedQty)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(report.Totals.TotalProducedQty)).Bold();
                        table.Cell().Element(TotalCell).AlignRight().Text(FmtQty(report.Totals.TotalVarianceQty)).Bold();
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

    public byte[] RenderExcel(DailyProductionReportDto report)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Daily Production");

        ws.Cell(1, 1).Value = report.CompanyName;
        ws.Range(1, 1, 1, 9).Merge();
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        ws.Cell(2, 1).Value = report.ReportTitle;
        ws.Range(2, 1, 2, 9).Merge();
        ws.Cell(2, 1).Style.Font.Bold = true;

        ws.Cell(3, 1).Value = "Production date:";
        ws.Cell(3, 2).Value = report.ReportDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        ws.Cell(4, 1).Value = "Generated (Sri Lanka):";
        ws.Cell(4, 2).Value = SriLankaDisplayTime.FormatUtcInstant(report.GeneratedAtUtc);

        var headerRow = 6;
        var headers = new[]
        {
            "#", "Item code", "Item name", "Section(s)", "Planned qty", "Produced qty", "Variance", "Status", "Lines",
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
            ws.Cell(r, 2).Value = row.ProductCode;
            ws.Cell(r, 3).Value = row.ProductName;
            ws.Cell(r, 4).Value = row.Sections;
            ws.Cell(r, 5).Value = row.PlannedQty;
            ws.Cell(r, 6).Value = row.ProducedQty;
            ws.Cell(r, 7).Value = row.VarianceQty;
            ws.Cell(r, 8).Value = row.StatusSummary;
            ws.Cell(r, 9).Value = row.LineCount;
            r++;
        }

        ws.Cell(r, 1).Value = "Totals";
        ws.Range(r, 1, r, 4).Merge();
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 5).Value = report.Totals.TotalPlannedQty;
        ws.Cell(r, 6).Value = report.Totals.TotalProducedQty;
        ws.Cell(r, 7).Value = report.Totals.TotalVarianceQty;

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(headerRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string FmtQty(decimal v) =>
        v.ToString("0.####", CultureInfo.InvariantCulture);

    private static string Truncate(string s, int max)
    {
        if (string.IsNullOrEmpty(s) || s.Length <= max)
            return s;
        return s[..(max - 1)] + "…";
    }
}
