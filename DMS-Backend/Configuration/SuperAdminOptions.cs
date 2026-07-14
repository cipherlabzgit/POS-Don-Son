namespace DMS_Backend.Configuration;

public sealed class SuperAdminOptions
{
    public const string SectionName = "SuperAdmin";

    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = "System";
    public string LastName { get; set; } = "Administrator";
    public string Password { get; set; } = string.Empty;
}
