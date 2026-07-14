using Microsoft.EntityFrameworkCore;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Data.Seeders;

public sealed class PermissionSeeder
{
    private readonly ApplicationDbContext _context;

    public PermissionSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        // Check if permissions already exist
        if (await _context.Permissions.AnyAsync())
            return;

        var permissions = new List<Permission>
        {
            // User Management
            new() { Id = Guid.NewGuid(), Code = "users.view", Module = "Users", Name = "View Users", Description = "View user list and details", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "users.create", Module = "Users", Name = "Create Users", Description = "Create new users", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "users.update", Module = "Users", Name = "Update Users", Description = "Update existing users", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "users.delete", Module = "Users", Name = "Delete Users", Description = "Delete users", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Role Management
            new() { Id = Guid.NewGuid(), Code = "roles.view", Module = "Roles", Name = "View Roles", Description = "View role list and details", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "roles.create", Module = "Roles", Name = "Create Roles", Description = "Create new roles", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "roles.update", Module = "Roles", Name = "Update Roles", Description = "Update existing roles", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "roles.delete", Module = "Roles", Name = "Delete Roles", Description = "Delete roles", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "roles.assign_permissions", Module = "Roles", Name = "Assign Permissions", Description = "Assign permissions to roles", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Permission Management
            new() { Id = Guid.NewGuid(), Code = "permissions.view", Module = "Permissions", Name = "View Permissions", Description = "View all available permissions", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Outlet Management
            new() { Id = Guid.NewGuid(), Code = "outlets.view", Module = "Outlets", Name = "View Outlets", Description = "View outlet list", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "outlets.create", Module = "Outlets", Name = "Create Outlets", Description = "Create new outlets", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "outlets.update", Module = "Outlets", Name = "Update Outlets", Description = "Update outlets", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "outlets.delete", Module = "Outlets", Name = "Delete Outlets", Description = "Delete outlets", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Product Management
            new() { Id = Guid.NewGuid(), Code = "products.view", Module = "Products", Name = "View Products", Description = "View product catalog", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "products.create", Module = "Products", Name = "Create Products", Description = "Create new products", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "products.update", Module = "Products", Name = "Update Products", Description = "Update products", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "products.delete", Module = "Products", Name = "Delete Products", Description = "Delete products", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Ingredient Management
            new() { Id = Guid.NewGuid(), Code = "ingredients.view", Module = "Ingredients", Name = "View Ingredients", Description = "View ingredient list", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "ingredients.create", Module = "Ingredients", Name = "Create Ingredients", Description = "Create new ingredients", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "ingredients.update", Module = "Ingredients", Name = "Update Ingredients", Description = "Update ingredients", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "ingredients.delete", Module = "Ingredients", Name = "Delete Ingredients", Description = "Delete ingredients", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Recipe Management
            new() { Id = Guid.NewGuid(), Code = "recipes.view", Module = "Recipes", Name = "View Recipes", Description = "View recipes", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "recipes.create", Module = "Recipes", Name = "Create Recipes", Description = "Create new recipes", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "recipes.update", Module = "Recipes", Name = "Update Recipes", Description = "Update recipes", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "recipes.delete", Module = "Recipes", Name = "Delete Recipes", Description = "Delete recipes", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Order Management
            new() { Id = Guid.NewGuid(), Code = "orders.view", Module = "Orders", Name = "View Orders", Description = "View orders", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "orders.create", Module = "Orders", Name = "Create Orders", Description = "Create new orders", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "orders.update", Module = "Orders", Name = "Update Orders", Description = "Update orders", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "orders.delete", Module = "Orders", Name = "Delete Orders", Description = "Delete orders", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Production
            new() { Id = Guid.NewGuid(), Code = "production.view", Module = "Production", Name = "View Production", Description = "View production planner", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Reports
            new() { Id = Guid.NewGuid(), Code = "reports.view", Module = "Reports", Name = "View Reports", Description = "View reports", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "reports.export", Module = "Reports", Name = "Export Reports", Description = "Export reports to PDF/Excel", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Audit Logs
            new() { Id = Guid.NewGuid(), Code = "logs.view", Module = "Logs", Name = "View Logs", Description = "View audit and system logs", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "logs.export", Module = "Logs", Name = "Export Logs", Description = "Export logs", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },

            // Settings
            new() { Id = Guid.NewGuid(), Code = "settings.view", Module = "Settings", Name = "View Settings", Description = "View system settings", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Code = "settings.update", Module = "Settings", Name = "Update Settings", Description = "Update system settings", IsSystemPermission = true, CreatedAt = DateTimeOffset.UtcNow }
        };

        await _context.Permissions.AddRangeAsync(permissions);
        await _context.SaveChangesAsync();
    }
}
