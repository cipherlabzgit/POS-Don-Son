using DMS_Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data.Seeders;

/// <summary>
/// Seeds the 14 standard workflow operation entries shown in the WorkFlow Config page.
/// Runs on every startup; only inserts rows that do not already exist (idempotent).
/// </summary>
public sealed class WorkflowConfigDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkflowConfigDataSeeder> _logger;

    public WorkflowConfigDataSeeder(ApplicationDbContext context, ILogger<WorkflowConfigDataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static readonly (string Code, string Name, string EntityType, string Description)[] Operations =
    [
        ("WF-DAILY-PROD",    "Daily Production",        "Production",     "Workflow for daily production operations"),
        ("WF-DAYEND-BAL",    "DayEnd Process Balance",  "DayEnd",         "Workflow for day-end process balance"),
        ("WF-DELIVERY",      "Delivery",                "Delivery",       "Workflow for delivery operations"),
        ("WF-DEL-CANCEL",    "Delivery Cancel",         "Delivery",       "Workflow for delivery cancellations"),
        ("WF-DEL-RETURN",    "Delivery Return",         "Delivery",       "Workflow for delivery returns"),
        ("WF-DISPOSAL",      "Disposal",                "Disposal",       "Workflow for disposal operations"),
        ("WF-END-PROCESS",   "End Process",             "Production",     "Workflow for end-of-process operations"),
        ("WF-LABEL-PRINT",   "Label Printing",          "Label",          "Workflow for label printing approvals"),
        ("WF-PROD-CANCEL",   "Production Cancel",       "Production",     "Workflow for production cancellations"),
        ("WF-PROD-BF",       "Production BF",           "Production",     "Workflow for production brought-forward"),
        ("WF-SHOWROOM-LBL",  "Showroom Label",          "Label",          "Workflow for showroom label requests"),
        ("WF-CASHIER-BAL",   "Cashier Balance",         "Finance",        "Workflow for cashier balance approvals"),
        ("WF-STOCK-ADJ",     "Stock Adjustment",        "Inventory",      "Workflow for stock adjustment approvals"),
        ("WF-PRICE-UPD",     "Price Update",            "Pricing",        "Workflow for price update approvals"),
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var existingCodes = await _context.WorkflowConfigs
            .Select(w => w.Code)
            .ToListAsync(cancellationToken);

        var toAdd = Operations
            .Where(op => !existingCodes.Contains(op.Code))
            .Select(op => new WorkflowConfig
            {
                Id = Guid.NewGuid(),
                Code = op.Code,
                Name = op.Name,
                Description = op.Description,
                EntityType = op.EntityType,
                WorkflowType = "Approval",
                RequiresApproval = true,
                ApprovalLevels = 1,
                IsEnabled = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            _context.WorkflowConfigs.AddRange(toAdd);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("WorkflowConfigDataSeeder: inserted {Count} workflow operation(s)", toAdd.Count);
        }
        else
        {
            _logger.LogInformation("WorkflowConfigDataSeeder: all workflow operations already exist, skipping");
        }
    }
}
