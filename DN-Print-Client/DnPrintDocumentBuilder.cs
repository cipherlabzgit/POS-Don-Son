using System.Globalization;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;

namespace DN_Print_Client;

/// <summary>
/// Renders Delivery Notes at 5×5 inches, 12 rows/page, printed-by + page #,
/// signature lines on the last page only.
/// </summary>
public static class DnPrintDocumentBuilder
{
    private const double Dpi = 96.0;
    private const int RowsPerPage = 12;

    public static void Print(DnPrintPayloadDto payload, string? printerName)
    {
        var width = (payload.PageWidthInches > 0 ? payload.PageWidthInches : 5) * Dpi;
        var height = (payload.PageHeightInches > 0 ? payload.PageHeightInches : 5) * Dpi;
        var rowsPerPage = payload.RowsPerPage > 0 ? payload.RowsPerPage : RowsPerPage;

        var lines = payload.Lines ?? new List<DnPrintLineDto>();
        var pages = Chunk(lines, rowsPerPage);
        if (pages.Count == 0) pages.Add(new List<DnPrintLineDto>());

        var document = new FixedDocument();
        document.DocumentPaginator.PageSize = new Size(width, height);

        for (var i = 0; i < pages.Count; i++)
        {
            var page = BuildPage(
                payload,
                pages[i],
                pageNo: i + 1,
                pageCount: pages.Count,
                isLast: i == pages.Count - 1,
                width,
                height,
                rowsPerPage);

            var pageContent = new PageContent();
            ((System.Windows.Markup.IAddChild)pageContent).AddChild(page);
            document.Pages.Add(pageContent);
        }

        var printDialog = new PrintDialog();
        var queue = ResolvePrintQueue(printerName);
        printDialog.PrintQueue = queue;
        printDialog.PrintTicket.PageMediaSize = new PageMediaSize(width, height);
        printDialog.PrintDocument(document.DocumentPaginator, $"DN {payload.DeliveryNo}");
    }

    /// <summary>
    /// Prefer explicit printer; otherwise this PC's Windows default printer (LAN station).
    /// </summary>
    public static PrintQueue ResolvePrintQueue(string? printerName)
    {
        var server = new LocalPrintServer();
        if (!string.IsNullOrWhiteSpace(printerName))
        {
            var named = server.GetPrintQueues()
                .FirstOrDefault(q => string.Equals(q.Name, printerName, StringComparison.OrdinalIgnoreCase));
            if (named != null) return named;
        }

        return LocalPrintServer.GetDefaultPrintQueue();
    }

    public static string GetEffectivePrinterName(string? configuredPrinterName)
    {
        try
        {
            return ResolvePrintQueue(configuredPrinterName).Name;
        }
        catch
        {
            return configuredPrinterName ?? "(default)";
        }
    }

    private static FixedPage BuildPage(
        DnPrintPayloadDto payload,
        List<DnPrintLineDto> pageLines,
        int pageNo,
        int pageCount,
        bool isLast,
        double width,
        double height,
        int rowsPerPage)
    {
        var root = new Border
        {
            Width = width,
            Height = height,
            Padding = new Thickness(14),
            Background = Brushes.White,
            Child = new DockPanel(),
        };
        var panel = (DockPanel)root.Child;

        var footer = BuildFooter(payload, pageNo, pageCount);
        DockPanel.SetDock(footer, Dock.Bottom);
        panel.Children.Add(footer);

        if (isLast)
        {
            var sigs = BuildSignatures();
            DockPanel.SetDock(sigs, Dock.Bottom);
            panel.Children.Add(sigs);

            var totals = BuildTotals(payload, continued: false);
            DockPanel.SetDock(totals, Dock.Bottom);
            panel.Children.Add(totals);
        }
        else
        {
            var totals = BuildTotals(payload, continued: true);
            DockPanel.SetDock(totals, Dock.Bottom);
            panel.Children.Add(totals);
        }

        var header = BuildHeader(payload, pageNo == 1);
        DockPanel.SetDock(header, Dock.Top);
        panel.Children.Add(header);

        var table = BuildTable(pageLines, rowsPerPage);
        panel.Children.Add(table);

        var page = new FixedPage
        {
            Width = width,
            Height = height,
            Background = Brushes.White,
        };
        page.Children.Add(root);
        FixedPage.SetLeft(root, 0);
        FixedPage.SetTop(root, 0);
        return page;
    }

    private static UIElement BuildHeader(DnPrintPayloadDto payload, bool includeNotes)
    {
        var stack = new StackPanel();
        stack.Children.Add(new TextBlock
        {
            Text = "DON & SONS",
            FontSize = 9,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(0xA5, 0x1C, 0x30)),
        });
        stack.Children.Add(new TextBlock
        {
            Text = "Delivery Note",
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(0xA5, 0x1C, 0x30)),
            Margin = new Thickness(0, 0, 0, 4),
        });

        var grid = new Grid { Margin = new Thickness(0, 0, 0, 4) };
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.RowDefinitions.Add(new RowDefinition());
        grid.RowDefinitions.Add(new RowDefinition());

        AddMeta(grid, 0, 0, "DN No", payload.DeliveryNo);
        AddMeta(grid, 0, 1, "Date", FormatDate(payload.DeliveryDate));
        AddMeta(grid, 1, 0, "Showroom", payload.ShowroomName);
        AddMeta(grid, 1, 1, "Status", payload.Status);
        stack.Children.Add(grid);

        if (includeNotes && !string.IsNullOrWhiteSpace(payload.Notes))
        {
            stack.Children.Add(new Border
            {
                BorderBrush = Brushes.LightGray,
                BorderThickness = new Thickness(1),
                Padding = new Thickness(4),
                Margin = new Thickness(0, 0, 0, 4),
                Child = new TextBlock
                {
                    Text = payload.Notes,
                    FontSize = 9,
                    TextWrapping = TextWrapping.Wrap,
                },
            });
        }

        return stack;
    }

    private static void AddMeta(Grid grid, int row, int col, string lab, string val)
    {
        var sp = new StackPanel { Margin = new Thickness(0, 0, 8, 2) };
        sp.Children.Add(new TextBlock { Text = lab.ToUpperInvariant(), FontSize = 7, Foreground = Brushes.Gray });
        sp.Children.Add(new TextBlock { Text = string.IsNullOrWhiteSpace(val) ? "—" : val, FontSize = 10, FontWeight = FontWeights.SemiBold });
        Grid.SetRow(sp, row);
        Grid.SetColumn(sp, col);
        grid.Children.Add(sp);
    }

    private static UIElement BuildTable(List<DnPrintLineDto> pageLines, int rowsPerPage)
    {
        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(2.4, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(0.7, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(0.9, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(0.9, GridUnitType.Star) });

        for (var r = 0; r <= rowsPerPage; r++)
            grid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

        AddCell(grid, 0, 0, "Product", true, TextAlignment.Left);
        AddCell(grid, 0, 1, "Qty", true, TextAlignment.Right);
        AddCell(grid, 0, 2, "Price", true, TextAlignment.Right);
        AddCell(grid, 0, 3, "Total", true, TextAlignment.Right);

        for (var i = 0; i < rowsPerPage; i++)
        {
            if (i < pageLines.Count)
            {
                var line = pageLines[i];
                var label = string.IsNullOrWhiteSpace(line.ProductCode)
                    ? line.ProductName
                    : $"{line.ProductCode} - {line.ProductName}";
                AddCell(grid, i + 1, 0, label, false, TextAlignment.Left);
                AddCell(grid, i + 1, 1, line.Quantity.ToString("0.##", CultureInfo.InvariantCulture), false, TextAlignment.Right);
                AddCell(grid, i + 1, 2, FormatMoney(line.UnitPrice), false, TextAlignment.Right);
                AddCell(grid, i + 1, 3, FormatMoney(line.Total), false, TextAlignment.Right);
            }
            else
            {
                AddCell(grid, i + 1, 0, " ", false, TextAlignment.Left);
                AddCell(grid, i + 1, 1, " ", false, TextAlignment.Right);
                AddCell(grid, i + 1, 2, " ", false, TextAlignment.Right);
                AddCell(grid, i + 1, 3, " ", false, TextAlignment.Right);
            }
        }

        return grid;
    }

    private static void AddCell(Grid grid, int row, int col, string text, bool header, TextAlignment align)
    {
        var border = new Border
        {
            BorderBrush = Brushes.Silver,
            BorderThickness = new Thickness(0.5),
            Padding = new Thickness(3, 1, 3, 1),
            Background = header ? new SolidColorBrush(Color.FromRgb(0xF3, 0xF4, 0xF6)) : Brushes.Transparent,
            Child = new TextBlock
            {
                Text = text,
                FontSize = header ? 8 : 9,
                FontWeight = header ? FontWeights.SemiBold : FontWeights.Normal,
                TextAlignment = align,
                VerticalAlignment = VerticalAlignment.Center,
                TextTrimming = TextTrimming.CharacterEllipsis,
            },
        };
        Grid.SetRow(border, row);
        Grid.SetColumn(border, col);
        grid.Children.Add(border);
    }

    private static UIElement BuildTotals(DnPrintPayloadDto payload, bool continued)
    {
        if (continued)
        {
            return new TextBlock
            {
                Text = "Continued…",
                FontSize = 9,
                FontStyle = FontStyles.Italic,
                Foreground = Brushes.Gray,
                Margin = new Thickness(0, 4, 0, 2),
            };
        }

        var sp = new DockPanel { Margin = new Thickness(0, 4, 0, 2) };
        sp.Children.Add(new TextBlock
        {
            Text = $"Items: {payload.TotalItems}",
            FontSize = 10,
            FontWeight = FontWeights.SemiBold,
            HorizontalAlignment = HorizontalAlignment.Left,
        });
        sp.Children.Add(new TextBlock
        {
            Text = $"Total: {FormatMoney(payload.TotalValue)}",
            FontSize = 10,
            FontWeight = FontWeights.Bold,
            HorizontalAlignment = HorizontalAlignment.Right,
        });
        return sp;
    }

    private static UIElement BuildSignatures()
    {
        var grid = new Grid { Margin = new Thickness(0, 8, 0, 4) };
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.ColumnDefinitions.Add(new ColumnDefinition());

        string[] labels = ["Prepared By", "Checked By", "Received By"];
        for (var i = 0; i < 3; i++)
        {
            var stack = new StackPanel { Margin = new Thickness(4, 0, 4, 0) };
            stack.Children.Add(new Border
            {
                BorderBrush = Brushes.Black,
                BorderThickness = new Thickness(0, 0, 0, 1),
                Height = 20,
                Margin = new Thickness(0, 0, 0, 2),
            });
            stack.Children.Add(new TextBlock
            {
                Text = labels[i],
                FontSize = 8,
                Foreground = Brushes.DimGray,
                HorizontalAlignment = HorizontalAlignment.Center,
            });
            Grid.SetColumn(stack, i);
            grid.Children.Add(stack);
        }
        return grid;
    }

    private static UIElement BuildFooter(DnPrintPayloadDto payload, int pageNo, int pageCount)
    {
        var printedAt = FormatDate(payload.PrintedAt);
        var left = $"Printed by {payload.PrintedBy} · {printedAt}";
        var right = $"Page {pageNo} / {pageCount}";

        var panel = new DockPanel
        {
            Margin = new Thickness(0, 4, 0, 0),
        };
        panel.Children.Add(new Border
        {
            BorderBrush = Brushes.Silver,
            BorderThickness = new Thickness(0, 1, 0, 0),
            Padding = new Thickness(0, 3, 0, 0),
            Child = new Grid
            {
                Children =
                {
                    new TextBlock { Text = left, FontSize = 8, Foreground = Brushes.DimGray, HorizontalAlignment = HorizontalAlignment.Left },
                    new TextBlock { Text = right, FontSize = 8, Foreground = Brushes.DimGray, HorizontalAlignment = HorizontalAlignment.Right },
                },
            },
        });
        return panel;
    }

    private static List<List<DnPrintLineDto>> Chunk(List<DnPrintLineDto> lines, int size)
    {
        var pages = new List<List<DnPrintLineDto>>();
        for (var i = 0; i < lines.Count; i += size)
            pages.Add(lines.GetRange(i, Math.Min(size, lines.Count - i)));
        return pages;
    }

    private static string FormatMoney(decimal n) =>
        "Rs. " + n.ToString("N2", CultureInfo.InvariantCulture);

    private static string FormatDate(string iso)
    {
        if (DateTime.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt))
            return dt.ToLocalTime().ToString("dd MMM yyyy HH:mm", CultureInfo.InvariantCulture);
        return string.IsNullOrWhiteSpace(iso) ? "—" : iso;
    }
}
