using DMS_Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data.Seeders;

/// <summary>
/// Seeds the 15 subsection auto-approval configurations.
/// Runs on every startup; only inserts rows that do not already exist (idempotent).
/// </summary>
public sealed class AutoApprovalConfigSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AutoApprovalConfigSeeder> _logger;

    public AutoApprovalConfigSeeder(ApplicationDbContext context, ILogger<AutoApprovalConfigSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static readonly (string SubsectionCode, string SubsectionName, string Module)[] Subsections =
    [
        // Operation Module
        ("operation:delivery", "Delivery", "Operation"),
        ("operation:delivery-return", "Delivery Return", "Operation"),
        ("operation:transfer", "Transfer", "Operation"),
        ("operation:disposal", "Disposal", "Operation"),
        ("operation:cancellation", "Cancellation", "Operation"),
        ("operation:label-printing", "Label Printing", "Operation"),
        ("operation:stock-bf", "Stock BF", "Operation"),
        ("operation:stores-issue-note", "Stores Issue Note", "Operation"),
        
        // Production Module
        ("production:daily", "Daily Production", "Production"),
        ("production:cancel", "Production Cancel", "Production"),
        ("production:stock-adjustment", "Stock Adjustment", "Production"),
        ("production:daily-plan", "Daily Production Plan", "Production"),
        
        // DMS Module
        ("dms:delivery-plan", "Delivery Plan", "DMS"),
        ("dms:immediate-order", "Immediate Order", "DMS"),
        ("dms:reconciliation", "Reconciliation", "DMS"),
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var existingCodes = await _context.AutoApprovalConfigs
            .Select(c => c.SubsectionCode)
            .ToListAsync(cancellationToken);

        var toAdd = Subsections
            .Where(s => !existingCodes.Contains(s.SubsectionCode))
            .Select(s => new AutoApprovalConfig
            {
                Id = Guid.NewGuid(),
                SubsectionCode = s.SubsectionCode,
                SubsectionName = s.SubsectionName,
                Module = s.Module,
                IsEnabled = false, // Default to disabled
                CreatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            _context.AutoApprovalConfigs.AddRange(toAdd);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("AutoApprovalConfigSeeder: inserted {Count} auto-approval config(s)", toAdd.Count);
        }
        else
        {
            _logger.LogInformation("AutoApprovalConfigSeeder: all auto-approval configs already exist, skipping");
        }
    }
}
