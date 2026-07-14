namespace DMS_Backend.Configuration;

public sealed class DevSeedOptions
{
    public const string SectionName = "DevSeed";

    public bool Enabled { get; set; } = false;
    public bool SeedUsers { get; set; } = true;
    public bool SeedMasterData { get; set; } = true;
}
