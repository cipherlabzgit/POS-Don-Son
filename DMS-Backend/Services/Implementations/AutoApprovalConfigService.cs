using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public class AutoApprovalConfigService : IAutoApprovalConfigService
{
    private readonly ApplicationDbContext _context;

    public AutoApprovalConfigService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AutoApprovalConfig>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AutoApprovalConfigs
            .OrderBy(c => c.Module)
            .ThenBy(c => c.SubsectionName)
            .ToListAsync(cancellationToken);
    }

    public async Task<AutoApprovalConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AutoApprovalConfigs
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<AutoApprovalConfig?> GetBySubsectionCodeAsync(string subsectionCode, CancellationToken cancellationToken = default)
    {
        return await _context.AutoApprovalConfigs
            .FirstOrDefaultAsync(c => c.SubsectionCode == subsectionCode, cancellationToken);
    }

    public async Task<AutoApprovalConfig> UpdateAsync(Guid id, bool isEnabled, Guid userId, CancellationToken cancellationToken = default)
    {
        var config = await _context.AutoApprovalConfigs
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (config == null)
        {
            throw new InvalidOperationException($"Auto-approval config with ID {id} not found");
        }

        config.IsEnabled = isEnabled;
        config.UpdatedAt = DateTimeOffset.UtcNow;
        config.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        return config;
    }

    public async Task<bool> IsAutoApprovalEnabledAsync(string subsectionCode, CancellationToken cancellationToken = default)
    {
        var config = await _context.AutoApprovalConfigs
            .FirstOrDefaultAsync(c => c.SubsectionCode == subsectionCode, cancellationToken);

        return config?.IsEnabled ?? false;
    }
}
