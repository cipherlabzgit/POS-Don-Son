using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace DN_Print_Client;

public sealed class DnPrintApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly HttpClient _http;

    public DnPrintApiClient(ClientSettings settings)
    {
        _http = new HttpClient
        {
            BaseAddress = new Uri(settings.ApiBaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(30),
        };
        _http.DefaultRequestHeaders.Remove("X-DN-Print-Client-Key");
        _http.DefaultRequestHeaders.Add("X-DN-Print-Client-Key", settings.ClientKey);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<List<DnPrintJobDto>> GetPendingAsync(string stationCode, CancellationToken ct)
    {
        var url = $"api/dn-print-jobs/pending?stationCode={Uri.EscapeDataString(stationCode)}&take=5";
        using var res = await _http.GetAsync(url, ct);
        res.EnsureSuccessStatusCode();
        var envelope = await ReadEnvelopeAsync<List<DnPrintJobDto>>(res, ct);
        return envelope ?? new List<DnPrintJobDto>();
    }

    public async Task<DnPrintJobDto?> ClaimAsync(Guid jobId, string stationCode, CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new { stationCode }, JsonOptions);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var res = await _http.PostAsync($"api/dn-print-jobs/{jobId}/claim", content, ct);
        res.EnsureSuccessStatusCode();
        return await ReadEnvelopeAsync<DnPrintJobDto>(res, ct);
    }

    public async Task CompleteAsync(Guid jobId, string stationCode, CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new { stationCode }, JsonOptions);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var res = await _http.PostAsync($"api/dn-print-jobs/{jobId}/complete", content, ct);
        res.EnsureSuccessStatusCode();
    }

    public async Task FailAsync(Guid jobId, string stationCode, string error, CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new { stationCode, errorMessage = error }, JsonOptions);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var res = await _http.PostAsync($"api/dn-print-jobs/{jobId}/fail", content, ct);
        res.EnsureSuccessStatusCode();
    }

    public async Task<DnPrintAgentHeartbeatResult?> HeartbeatAsync(
        string stationCode,
        string? machineName,
        string? printerName,
        string? appVersion,
        CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new
        {
            stationCode,
            machineName,
            printerName,
            appVersion,
        }, JsonOptions);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var res = await _http.PostAsync("api/dn-print-agents/heartbeat", content, ct);
        res.EnsureSuccessStatusCode();
        return await ReadEnvelopeAsync<DnPrintAgentHeartbeatResult>(res, ct);
    }

    private static async Task<T?> ReadEnvelopeAsync<T>(HttpResponseMessage res, CancellationToken ct)
    {
        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        if (doc.RootElement.TryGetProperty("data", out var data))
            return data.Deserialize<T>(JsonOptions);
        if (doc.RootElement.TryGetProperty("Data", out var data2))
            return data2.Deserialize<T>(JsonOptions);
        return doc.RootElement.Deserialize<T>(JsonOptions);
    }
}

public sealed class DnPrintAgentHeartbeatResult
{
    public string? PendingCommand { get; set; }
    public bool IsOnline { get; set; }
}

public sealed class DnPrintJobDto
{
    public Guid Id { get; set; }
    public Guid DeliveryId { get; set; }
    public string DeliveryNo { get; set; } = "";
    public string Status { get; set; } = "";
    public DnPrintPayloadDto? Payload { get; set; }
}

public sealed class DnPrintPayloadDto
{
    public Guid DeliveryId { get; set; }
    public string DeliveryNo { get; set; } = "";
    public string DeliveryDate { get; set; } = "";
    public string ShowroomName { get; set; } = "";
    public string Status { get; set; } = "";
    public string? Notes { get; set; }
    public string PrintedBy { get; set; } = "";
    public string PrintedAt { get; set; } = "";
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public List<DnPrintLineDto> Lines { get; set; } = new();
    public int RowsPerPage { get; set; } = 12;
    public double PageWidthInches { get; set; } = 5;
    public double PageHeightInches { get; set; } = 5;
}

public sealed class DnPrintLineDto
{
    public string ProductCode { get; set; } = "";
    public string ProductName { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}
