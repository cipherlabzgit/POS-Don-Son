using System.IO;
using System.Text.Json;
using System.Windows;

namespace DN_Print_Client;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        Directory.CreateDirectory(ClientSettings.AppDataDir);
        ClientSettings.Load();
    }
}
