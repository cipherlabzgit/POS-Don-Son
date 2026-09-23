using System.Printing;
using System.Reflection;
using System.Windows;
using System.Windows.Threading;

namespace DN_Print_Client;

public partial class MainWindow : Window
{
    private CancellationTokenSource? _cts;
    private Task? _pollTask;
    private static readonly string AppVersion =
        Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "1.0.0";

    public MainWindow()
    {
        InitializeComponent();
        LoadUiFromSettings();
        LoadPrinters();
    }

    private void LoadUiFromSettings()
    {
        var s = ClientSettings.Current;
        ApiBaseUrlBox.Text = s.ApiBaseUrl;
        ClientKeyBox.Text = s.ClientKey;
        StationCodeBox.Text = s.StationCode;
        PrinterBox.Text = s.PrinterName ?? "";
    }

    private void LoadPrinters()
    {
        try
        {
            PrinterBox.Items.Clear();
            PrinterBox.Items.Add("(Windows Default Printer)");
            var server = new LocalPrintServer();
            foreach (var q in server.GetPrintQueues())
                PrinterBox.Items.Add(q.Name);

            if (string.IsNullOrWhiteSpace(PrinterBox.Text))
                PrinterBox.SelectedIndex = 0;
        }
        catch
        {
            /* ignore */
        }
    }

    private void SaveBtn_OnClick(object sender, RoutedEventArgs e)
    {
        PersistSettingsFromUi();
        Log("Settings saved.");
    }

    private void PersistSettingsFromUi()
    {
        ClientSettings.Current.ApiBaseUrl = ApiBaseUrlBox.Text.Trim();
        ClientSettings.Current.ClientKey = ClientKeyBox.Text.Trim();
        ClientSettings.Current.StationCode = StationCodeBox.Text.Trim();
        var printer = PrinterBox.Text.Trim();
        ClientSettings.Current.PrinterName =
            string.IsNullOrWhiteSpace(printer) || printer.StartsWith("(Windows Default", StringComparison.OrdinalIgnoreCase)
                ? null
                : printer;
        ClientSettings.Save();
    }

    private void StartBtn_OnClick(object sender, RoutedEventArgs e)
    {
        PersistSettingsFromUi();
        if (string.IsNullOrWhiteSpace(ClientSettings.Current.ApiBaseUrl) ||
            string.IsNullOrWhiteSpace(ClientSettings.Current.ClientKey) ||
            string.IsNullOrWhiteSpace(ClientSettings.Current.StationCode))
        {
            MessageBox.Show("API URL, Client Key, and Station Code are required.", "DN Print Client",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        _cts = new CancellationTokenSource();
        StartBtn.IsEnabled = false;
        StopBtn.IsEnabled = true;
        SetStatus("Online (heartbeat)", running: true);
        _pollTask = Task.Run(() => PollLoopAsync(_cts.Token));
        Log($"Started — will print to: {DnPrintDocumentBuilder.GetEffectivePrinterName(ClientSettings.Current.PrinterName)}");
    }

    private async void StopBtn_OnClick(object sender, RoutedEventArgs e)
    {
        if (_cts != null)
        {
            await _cts.CancelAsync();
            try { if (_pollTask != null) await _pollTask; } catch { /* ignore */ }
        }

        StartBtn.IsEnabled = true;
        StopBtn.IsEnabled = false;
        SetStatus("Stopped (offline)", running: false);
        Log("Polling stopped — portal will show Offline after ~15s.");
    }

    private async Task PollLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var settings = ClientSettings.Current;
                var api = new DnPrintApiClient(settings);

                // Heartbeat first so the web portal shows DN Print Online
                var printerName = DnPrintDocumentBuilder.GetEffectivePrinterName(settings.PrinterName);
                var hb = await api.HeartbeatAsync(
                    settings.StationCode,
                    Environment.MachineName,
                    printerName,
                    AppVersion,
                    ct);

                if (string.Equals(hb?.PendingCommand, "Restart", StringComparison.OrdinalIgnoreCase))
                {
                    Log("Restart command received — exiting client.");
                    await Dispatcher.InvokeAsync(() => Application.Current.Shutdown());
                    return;
                }

                if (string.Equals(hb?.PendingCommand, "Check", StringComparison.OrdinalIgnoreCase))
                {
                    Log("Check command acknowledged.");
                }

                var pending = await api.GetPendingAsync(settings.StationCode, ct);
                foreach (var job in pending)
                {
                    ct.ThrowIfCancellationRequested();
                    await ProcessJobAsync(api, job, settings, ct);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Log($"Poll/heartbeat error: {ex.Message}");
                SetStatus("Connection error", running: false);
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Max(2, ClientSettings.Current.PollIntervalSeconds)), ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task ProcessJobAsync(
        DnPrintApiClient api,
        DnPrintJobDto job,
        ClientSettings settings,
        CancellationToken ct)
    {
        Log($"Claiming {job.DeliveryNo} ({job.Id})…");
        var claimed = await api.ClaimAsync(job.Id, settings.StationCode, ct);
        var payload = claimed?.Payload ?? job.Payload;
        if (payload == null)
        {
            await api.FailAsync(job.Id, settings.StationCode, "Missing print payload", ct);
            Log($"FAIL {job.DeliveryNo}: missing payload");
            return;
        }

        try
        {
            var printer = DnPrintDocumentBuilder.GetEffectivePrinterName(settings.PrinterName);
            await Dispatcher.InvokeAsync(() =>
            {
                DnPrintDocumentBuilder.Print(payload, settings.PrinterName);
            }, DispatcherPriority.Normal, ct);

            await api.CompleteAsync(job.Id, settings.StationCode, ct);
            Log($"Printed {job.DeliveryNo} → {printer}");
            SetStatus("Online (heartbeat)", running: true);
        }
        catch (Exception ex)
        {
            try { await api.FailAsync(job.Id, settings.StationCode, ex.Message, ct); } catch { /* ignore */ }
            Log($"FAIL {job.DeliveryNo}: {ex.Message}");
        }
    }

    private void Log(string message)
    {
        var line = $"{DateTime.Now:HH:mm:ss}  {message}";
        Dispatcher.Invoke(() =>
        {
            LogList.Items.Insert(0, line);
            while (LogList.Items.Count > 300)
                LogList.Items.RemoveAt(LogList.Items.Count - 1);
        });
    }

    private void SetStatus(string text, bool running)
    {
        Dispatcher.Invoke(() =>
        {
            StatusText.Text = text;
            StatusText.Foreground = running
                ? System.Windows.Media.Brushes.SeaGreen
                : new System.Windows.Media.SolidColorBrush(
                    System.Windows.Media.Color.FromRgb(0xB4, 0x53, 0x09));
        });
    }

    protected override void OnClosed(EventArgs e)
    {
        _cts?.Cancel();
        base.OnClosed(e);
    }
}
