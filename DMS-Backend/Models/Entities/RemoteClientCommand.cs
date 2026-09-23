namespace DMS_Backend.Models.Entities;

/// <summary>Queued remote action for hybrid clients (DN / Label / POS).</summary>
public enum RemoteClientCommand
{
    None = 0,
    Check = 1,
    Restart = 2,
    Refresh = 3,
}
