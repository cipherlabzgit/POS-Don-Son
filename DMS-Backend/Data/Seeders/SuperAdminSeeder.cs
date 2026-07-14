using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DMS_Backend.Configuration;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Data.Seeders;

public sealed class SuperAdminSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly SuperAdminOptions _options;

    public SuperAdminSeeder(ApplicationDbContext context, IOptions<SuperAdminOptions> options)
    {
        _context = context;
        _options = options.Value;
    }

    public async Task SeedAsync()
    {
        // Check if super admin already exists
        var existingSuperAdmin = await _context.Users
            .FirstOrDefaultAsync(u => u.IsSuperAdmin);

        if (existingSuperAdmin != null)
            return;

        var email = (_options.Email ?? string.Empty).Trim();
        var password = _options.Password ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "SuperAdmin:Email and SuperAdmin:Password must be set in configuration (e.g. appsettings.json or environment variables) " +
                "before the first run so the initial super admin can be created.");
        }

        // Create super admin
        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant(),
            FirstName = _options.FirstName,
            LastName = _options.LastName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 12),
            IsSuperAdmin = true,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await _context.Users.AddAsync(superAdmin);
        await _context.SaveChangesAsync();
    }
}
