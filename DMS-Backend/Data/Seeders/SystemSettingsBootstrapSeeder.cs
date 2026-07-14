using Microsoft.EntityFrameworkCore;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Data.Seeders;

/// <summary>
/// Ensures core administrator system settings exist (idempotent by <see cref="SystemSetting.SettingKey"/>).
/// </summary>
public sealed class SystemSettingsBootstrapSeeder
{
    private readonly ApplicationDbContext _context;

    public SystemSettingsBootstrapSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var defaults = new[]
        {
            new
            {
                Key = "AllowNonAdminDisposalDateChange",
                Name = "Dispos Date Change",
                Value = "0",
                Description = "Allow to non-admin users to change Dispose Date in Disposal - [0 - Disallow, 1 - Allow]",
                Order = 1,
            },
            new
            {
                Key = "AllowNonAdminDeliveredDateChange",
                Name = "Delivered Date Change",
                Value = "0",
                Description = "Allow to non-admin users to change Delivered Date in Disposal - [0 - Disallow, 1 - Allow]",
                Order = 2,
            },
            new
            {
                Key = "StockBfBlockCurrentDateForNonAdmin",
                Name = "Block the current date in Stock BF",
                Value = "1",
                Description = "Block the current date in Stock BF for non-admin users [0 - Disable, 1 - Enable]",
                Order = 3,
            },
            new
            {
                Key = "DayLockAllowNonAdmins",
                Name = "Day Locking for non-admins",
                Value = "1",
                Description = "0 - Disallow day lock for non-admins, 1 - Allow non-admins to lock",
                Order = 4,
            },
            new
            {
                Key = "DayUnlockAllowNonAdmins",
                Name = "Day UnLocking for non-admins",
                Value = "0",
                Description = "0 - Disallow day unlock for non-admins, 1 - Allow non-admins to unlock",
                Order = 5,
            },
        };

        foreach (var d in defaults)
        {
            var exists = await _context.SystemSettings.AnyAsync(s => s.SettingKey == d.Key, cancellationToken);
            if (exists)
            {
                continue;
            }

            _context.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid(),
                SettingKey = d.Key,
                SettingName = d.Name,
                SettingValue = d.Value,
                SettingType = "Number",
                Description = d.Description,
                Category = "Administrator",
                IsSystemSetting = true,
                IsEncrypted = false,
                DisplayOrder = d.Order,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
