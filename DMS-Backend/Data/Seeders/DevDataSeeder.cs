using DMS_Backend.Configuration;
using DMS_Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DMS_Backend.Data.Seeders;

/// <summary>
/// Seeder for development/demo data
/// </summary>
public sealed class DevDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly DevSeedOptions _options;
    private readonly ILogger<DevDataSeeder> _logger;

    public DevDataSeeder(
        ApplicationDbContext context,
        IOptions<DevSeedOptions> options,
        ILogger<DevDataSeeder> logger)
    {
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("Starting dev data seed");

        try
        {
            if (_options.SeedMasterData)
            {
                await SeedMasterDataAsync();
            }

            if (_options.SeedUsers)
            {
                await SeedDemoRolesAsync();
                await SeedDemoUsersAsync();
            }

            await SeedShowroomOpenStockAsync();
            await EnsurePosCatalogReadyAsync();
            _logger.LogInformation("Dev data seed completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding dev data");
            throw;
        }
    }

    private async Task SeedMasterDataAsync()
    {
        if (await _context.Products.AnyAsync())
        {
            _logger.LogInformation("Master data already exists, skipping");
            return;
        }

        _logger.LogInformation("Seeding demo master data (categories, products, outlets)");

        var now = DateTime.UtcNow;

        var uom = new UnitOfMeasure
        {
            Id = Guid.NewGuid(),
            Code = "PCS",
            Description = "Piece",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
        _context.UnitOfMeasures.Add(uom);

        var breadCategory = new Category
        {
            Id = Guid.NewGuid(),
            Code = "BREAD",
            Name = "Bread",
            Description = "Fresh bread products",
            DisplayInPOS = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
        var pastryCategory = new Category
        {
            Id = Guid.NewGuid(),
            Code = "PASTRY",
            Name = "Pastry",
            Description = "Pastries and sweet items",
            DisplayInPOS = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
        var savouryCategory = new Category
        {
            Id = Guid.NewGuid(),
            Code = "SAVOURY",
            Name = "Savoury",
            Description = "Savoury bakery items",
            DisplayInPOS = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
        _context.Categories.AddRange(breadCategory, pastryCategory, savouryCategory);

        var demoProducts = new (string Code, string Name, Guid CategoryId, decimal Price, int SortOrder)[]
        {
            ("BR001", "White Bread", breadCategory.Id, 120m, 1),
            ("BR002", "Brown Bread", breadCategory.Id, 140m, 2),
            ("BR003", "Sandwich Bread", breadCategory.Id, 160m, 3),
            ("PA001", "Fish Bun", pastryCategory.Id, 85m, 4),
            ("PA002", "Egg Bun", pastryCategory.Id, 75m, 5),
            ("PA003", "Jam Bun", pastryCategory.Id, 70m, 6),
            ("PA004", "Cream Bun", pastryCategory.Id, 90m, 7),
            ("SV001", "Fish Roll", savouryCategory.Id, 95m, 8),
            ("SV002", "Vegetable Roll", savouryCategory.Id, 80m, 9),
            ("SV003", "Chicken Patty", savouryCategory.Id, 110m, 10),
            ("SV004", "Sausage Roll", savouryCategory.Id, 100m, 11),
            ("PA005", "Donut", pastryCategory.Id, 65m, 12),
        };

        foreach (var (code, name, categoryId, price, sortOrder) in demoProducts)
        {
            _context.Products.Add(new Product
            {
                Id = Guid.NewGuid(),
                Code = code,
                Name = name,
                CategoryId = categoryId,
                UnitOfMeasureId = uom.Id,
                UnitPrice = price,
                ProductType = nameof(ProductCategory.Finished),
                DisplayInPOS = true,
                RequireOpenStock = true,
                SortOrder = sortOrder,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        _context.Outlets.Add(new Outlet
        {
            Id = Guid.NewGuid(),
            Code = "SR001",
            Name = "Main Showroom",
            Description = "Demo showroom for POS testing",
            Address = "Colombo",
            LocationType = "Showroom",
            DisplayOrder = 1,
            HasVariants = true,
            IsDeliveryPoint = true,
            ShowInDashboard = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        });

        _context.Outlets.Add(new Outlet
        {
            Id = Guid.NewGuid(),
            Code = "SR002",
            Name = "City Outlet",
            Description = "Second demo showroom",
            Address = "Kandy Road",
            LocationType = "Showroom",
            DisplayOrder = 2,
            HasVariants = true,
            IsDeliveryPoint = true,
            ShowInDashboard = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Master data seeded: {ProductCount} products, {CategoryCount} categories, {OutletCount} outlets",
            demoProducts.Length,
            3,
            2);
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
        if (!await _context.Roles.AnyAsync(r => r.Name == "Manager"))
        {
            _context.Roles.Add(new Role
            {
                Id = Guid.NewGuid(),
                Name = "Manager",
                Description = "Demo manager role with POS permissions",
                IsSystemRole = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        if (!await _context.Roles.AnyAsync(r => r.Name == "Operator"))
        {
            _context.Roles.Add(new Role
            {
                Id = Guid.NewGuid(),
                Name = "Operator",
                Description = "Demo operator role with POS permissions",
                IsSystemRole = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await _context.SaveChangesAsync();
        await EnsurePosRolePermissionsAsync("Manager");
        await EnsurePosRolePermissionsAsync("Operator");
        _logger.LogInformation("Demo roles ready with POS permissions");
    }

    private static readonly string[] PosRolePermissionCodes =
    [
        "products:view",
        "categories:view",
        "showroom:view",
        "pos:sale:view",
        "pos:sale:create",
    ];

    /// <summary>
    /// Ensures products/categories are visible in POS and POS roles have catalog permissions.
    /// Runs on every backend startup (not only when dev seed is enabled).
    /// </summary>
    public async Task EnsurePosCatalogReadyAsync()
    {
        var hiddenProducts = await _context.Products
            .Where(p => !p.DisplayInPOS)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.DisplayInPOS, true));

        var hiddenCategories = await _context.Categories
            .Where(c => !c.DisplayInPOS)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.DisplayInPOS, true));

        if (hiddenProducts > 0 || hiddenCategories > 0)
        {
            _logger.LogInformation(
                "POS catalog visibility fixed: {ProductCount} products, {CategoryCount} categories set DisplayInPOS=true",
                hiddenProducts,
                hiddenCategories);
        }

        await EnsurePosRolePermissionsAsync("Manager");
        await EnsurePosRolePermissionsAsync("Operator");
        await EnsureDemoUserRoleAssignmentsAsync();
    }

    private async Task EnsureDemoUserRoleAssignmentsAsync()
    {
        var managerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Manager");
        var operatorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Operator");
        if (managerRole == null || operatorRole == null) return;

        var manager = await _context.Users.FirstOrDefaultAsync(u => u.Email == "manager@donandson.com");
        if (manager != null && !await _context.UserRoles.AnyAsync(ur => ur.UserId == manager.Id))
        {
            _context.UserRoles.Add(new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = manager.Id,
                RoleId = managerRole.Id,
                AssignedAt = DateTime.UtcNow,
            });
        }

        var operatorUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "operator@donandson.com");
        if (operatorUser != null && !await _context.UserRoles.AnyAsync(ur => ur.UserId == operatorUser.Id))
        {
            _context.UserRoles.Add(new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = operatorUser.Id,
                RoleId = operatorRole.Id,
                AssignedAt = DateTime.UtcNow,
            });
        }

        await _context.SaveChangesAsync();
    }

    private async Task EnsurePosRolePermissionsAsync(string roleName)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null) return;

        var permissions = await _context.Permissions
            .Where(p => PosRolePermissionCodes.Contains(p.Code))
            .ToListAsync();

        var existing = await _context.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        foreach (var permission in permissions)
        {
            if (existing.Contains(permission.Id)) continue;

            _context.RolePermissions.Add(new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = role.Id,
                PermissionId = permission.Id,
                GrantedAt = DateTime.UtcNow,
            });
        }

        await _context.SaveChangesAsync();
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
