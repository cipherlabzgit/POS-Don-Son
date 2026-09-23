using System.IO;
using System.Text.Json;

namespace DN_Print_Client;

public sealed class ClientSettings
{
    public static string AppDataDir { get; } =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DonSons", "DN-Print-Client");

    private static string SettingsPath => Path.Combine(AppDataDir, "settings.json");

    public string ApiBaseUrl { get; set; } = "http://localhost:5000";
    public string ClientKey { get; set; } = "change-me";
    public string StationCode { get; set; } = "DN-01";
    public string? PrinterName { get; set; }
    public int PollIntervalSeconds { get; set; } = 3;

    public static ClientSettings Current { get; private set; } = new();

    public static void Load()
    {
        try
        {
            if (!File.Exists(SettingsPath))
            {
                Current = new ClientSettings();
                Save();
                return;
            }

            var json = File.ReadAllText(SettingsPath);
            Current = JsonSerializer.Deserialize<ClientSettings>(json) ?? new ClientSettings();
        }
        catch
        {
            Current = new ClientSettings();
        }
    }

    public static void Save()
    {
        Directory.CreateDirectory(AppDataDir);
        var json = JsonSerializer.Serialize(Current, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(SettingsPath, json);
    }
}
