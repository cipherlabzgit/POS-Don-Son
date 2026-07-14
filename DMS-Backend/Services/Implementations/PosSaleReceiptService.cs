using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.PosSales;
using DMS_Backend.Services.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DMS_Backend.Services.Implementations;

public class PosSaleReceiptService : IPosSaleReceiptService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    static PosSaleReceiptService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public PosSaleReceiptService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<PosSaleReceiptDto?> GetReceiptDataAsync(Guid posSaleId, CancellationToken cancellationToken = default)
    {
        var sale = await _context.PosSales
            .AsNoTracking()
            .Include(s => s.Outlet)
            .Include(s => s.CreatedBy)
            .Include(s => s.Lines)
            .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(s => s.Id == posSaleId && s.IsActive, cancellationToken);

        if (sale == null)
            return null;

        var companyName = _configuration["Receipt:CompanyName"] ?? "DON & SONS (PVT) LTD";
        var companyAddress = _configuration["Receipt:CompanyAddress"] ?? "NO: 302/D, OLD KANDY ROAD,\nDALUGAMA, KELANIYA";
        var companyPhone = _configuration["Receipt:CompanyPhone"] ?? "Tel:011-2911412/0768214432";
        var footerMessage = _configuration["Receipt:FooterMessage"] ?? "FOOD ARE NOT RETURNABLE\nCOMPLAINT MUST BE LODGED BEFORE\n12 NOON NEXT DAY";
        var poweredBy = _configuration["Receipt:PoweredBy"] ?? "Powered by www.yuvima.lk";

        var items = sale.Lines
            .Where(l => l.IsActive)
            .Select(l => new PosSaleReceiptLineDto
            {
                ItemName = l.Product?.Name ?? string.Empty,
                UnitPrice = l.UnitPrice,
                Quantity = l.Quantity,
                Total = l.LineTotal
            })
            .ToList();

        var cashierName = sale.CreatedBy != null
            ? (sale.CreatedBy.FullName ?? $"{sale.CreatedBy.FirstName} {sale.CreatedBy.LastName}".Trim())
            : string.Empty;

        var receipt = new PosSaleReceiptDto
        {
            CompanyName = companyName,
            CompanyAddress = companyAddress,
            CompanyPhone = companyPhone,
            ShowroomName = sale.Outlet?.Name ?? string.Empty,
            BillDate = sale.SoldAt,
            CashierName = cashierName,
            BillNo = sale.SaleNo,
            Items = items,
            Total = sale.TotalAmount,
            Cash = sale.TotalAmount,
            Change = 0,
            TotalQty = (int)items.Sum(i => i.Quantity),
            FooterMessage = footerMessage,
            PoweredBy = poweredBy
        };

        return receipt;
    }

    public byte[] GenerateReceiptPdf(PosSaleReceiptDto receipt)
    {
        using var stream = new MemoryStream();
        
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(80 * 2.83465f, 297);
                page.Margin(14);
                page.DefaultTextStyle(x => x.FontSize(8));

                page.Content().Column(column =>
                {
                    column.Item().AlignCenter().Text(receipt.CompanyName)
                        .Bold()
                        .FontSize(10);

                    foreach (var line in receipt.CompanyAddress.Split('\n'))
                    {
                        column.Item().AlignCenter().Text(line)
                            .FontSize(7);
                    }

                    column.Item().AlignCenter().Text(receipt.CompanyPhone)
                        .FontSize(7);

                    column.Item().PaddingTop(3).BorderBottom(1).BorderColor(Colors.Black);

                    column.Item().PaddingTop(2).Text($"Showroom : {receipt.ShowroomName}")
                        .FontSize(7);

                    column.Item().Text($"Date: {receipt.BillDate:M/d/yyyy h:mm:ss tt}")
                        .FontSize(7);

                    column.Item().Text($"Cashier: {receipt.CashierName}")
                        .FontSize(7);

                    column.Item().Text($"Bill No: {receipt.BillNo}")
                        .FontSize(7);

                    column.Item().PaddingTop(2).BorderBottom(1).BorderColor(Colors.Black);

                    column.Item().PaddingTop(2).Row(row =>
                    {
                        row.RelativeItem(4).Text("Item").Bold().FontSize(7);
                        row.RelativeItem(1).AlignRight().Text("Each").Bold().FontSize(7);
                        row.RelativeItem(1).AlignCenter().Text("Qty").Bold().FontSize(7);
                        row.RelativeItem(2).AlignRight().Text("Total").Bold().FontSize(7);
                    });

                    column.Item().BorderBottom(1).BorderColor(Colors.Black);

                    foreach (var item in receipt.Items)
                    {
                        column.Item().PaddingTop(2).Row(row =>
                        {
                            row.RelativeItem(4).Text(item.ItemName).FontSize(7);
                            row.RelativeItem(1).AlignRight().Text(item.UnitPrice.ToString("0.00")).FontSize(7);
                            row.RelativeItem(1).AlignCenter().Text(item.Quantity.ToString("0")).FontSize(7);
                            row.RelativeItem(2).AlignRight().Text(item.Total.ToString("0.00")).FontSize(7);
                        });
                    }

                    column.Item().PaddingTop(3).BorderBottom(1).BorderColor(Colors.Black);

                    column.Item().PaddingTop(3).Row(row =>
                    {
                        row.RelativeItem().Text("TOTAL").Bold().FontSize(8);
                        row.RelativeItem().AlignRight().Text(receipt.Total.ToString("0.00")).Bold().FontSize(8);
                    });

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Text("CASH").FontSize(7);
                        row.RelativeItem().AlignRight().Text(receipt.Cash.ToString("0.00")).FontSize(7);
                    });

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Text("CHANGE").FontSize(7);
                        row.RelativeItem().AlignRight().Text(receipt.Change.ToString("0.00")).FontSize(7);
                    });

                    column.Item().PaddingTop(3).BorderBottom(1).BorderColor(Colors.Black);

                    column.Item().PaddingTop(2).Text($"No of Items : {receipt.Items.Count}  Total Qty : {receipt.TotalQty}")
                        .FontSize(7);

                    column.Item().PaddingTop(2).BorderBottom(1).BorderColor(Colors.Black);

                    column.Item().PaddingTop(3).AlignCenter().Text(receipt.FooterMessage)
                        .FontSize(6)
                        .LineHeight(1.2f);

                    column.Item().PaddingTop(5).AlignCenter().Text("THANK YOU!")
                        .Bold()
                        .FontSize(8);

                    column.Item().PaddingTop(5).AlignCenter().Text(receipt.PoweredBy)
                        .FontSize(6)
                        .Italic();
                });
            });
        }).GeneratePdf(stream);

        return stream.ToArray();
    }
}
