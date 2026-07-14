using DMS_Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data.Seeders;

/// <summary>
/// Seeder for development/demo data
/// </summary>
public sealed class DevDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DevDataSeeder> _logger;

    public DevDataSeeder(ApplicationDbContext context, ILogger<DevDataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("Starting dev data seed");

        try
        {
            await SeedDemoUsersAsync();
            await SeedDemoRolesAsync();
            await SeedShowroomOpenStockAsync();
            
            _logger.LogInformation("Dev data seed completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding dev data");
            throw;
        }
    }

    private async Task SeedDemoUsersAsync()
    {
        // Check if demo users already exist
        if (await _context.Users.AnyAsync(u => u.Email == "manager@donandson.com"))
        {
            _logger.LogInformation("Demo users already exist, skipping");
            return;
        }

        var managerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Manager");
        var operatorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Operator");

        if (managerRole != null)
        {
            var manager = new User
            {
                Id = Guid.NewGuid(),
                Email = "manager@donandson.com",
                FirstName = "Demo",
                LastName = "Manager",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123", 12),
                IsActive = true,
                IsSuperAdmin = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(manager);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = manager.Id,
                RoleId = managerRole.Id,
                AssignedAt = DateTime.UtcNow
            });
        }

        if (operatorRole != null)
        {
            var operator1 = new User
            {
                Id = Guid.NewGuid(),
                Email = "operator@donandson.com",
                FirstName = "Demo",
                LastName = "Operator",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operator@123", 12),
                IsActive = true,
                IsSuperAdmin = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(operator1);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = operator1.Id,
                RoleId = operatorRole.Id,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Demo users seeded: manager@donandson.com (Manager@123), operator@donandson.com (Operator@123)");
    }

    private async Task SeedDemoRolesAsync()
    {
        // Check if Manager role exists
        if (await _context.Roles.AnyAsync(r => r.Name == "Manager"))
        {
            _logger.LogInformation("Demo roles already exist, skipping");
            return;
        }

        // Get some permissions for demo roles
        var viewPermissions = await _context.Permissions
            .Where(p => p.Code.Contains("view"))
            .Take(5)
            .ToListAsync();

        var managerRole = new Role
        {
            Id = Guid.NewGuid(),
            Name = "Manager",
            Description = "Demo manager role with extended permissions",
            IsSystemRole = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var operatorRole = new Role
        {
            Id = Guid.NewGuid(),
            Name = "Operator",
            Description = "Demo operator role with basic permissions",
            IsSystemRole = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Roles.AddRange(managerRole, operatorRole);
        await _context.SaveChangesAsync();

        // Assign permissions
        foreach (var permission in viewPermissions)
        {
            _context.RolePermissions.Add(new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = managerRole.Id,
                PermissionId = permission.Id,
                GrantedAt = DateTime.UtcNow
            });

            _context.RolePermissions.Add(new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = operatorRole.Id,
                PermissionId = permission.Id,
                GrantedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Demo roles seeded: Manager, Operator");
    }

    private async Task SeedShowroomOpenStockAsync()
    {
        if (await _context.ShowroomOpenStocks.AnyAsync())
        {
            _logger.LogInformation("Showroom open stock data already exists, skipping");
            return;
        }

        var outlets = await _context.Outlets
            .Where(o => o.IsActive)
            .OrderBy(o => o.Code)
            .ToListAsync();

        if (!outlets.Any())
        {
            _logger.LogWarning("No outlets found, skipping showroom open stock seeding");
            return;
        }

        var defaultStockDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        var showroomOpenStocks = new List<ShowroomOpenStock>();

        foreach (var outlet in outlets)
        {
            showroomOpenStocks.Add(new ShowroomOpenStock
            {
                Id = Guid.NewGuid(),
                OutletId = outlet.Id,
                StockAsAt = defaultStockDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.ShowroomOpenStocks.AddRange(showroomOpenStocks);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Showroom open stock seeded for {showroomOpenStocks.Count} outlets with date {defaultStockDate:yyyy-MM-dd}");
    }
}
