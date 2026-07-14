using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface IAutoApprovalConfigService
{
    /// <summary>
    /// Get all auto-approval configurations
    /// </summary>
    Task<List<AutoApprovalConfig>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get auto-approval configuration by ID
    /// </summary>
    Task<AutoApprovalConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get auto-approval configuration by subsection code
    /// </summary>
    Task<AutoApprovalConfig?> GetBySubsectionCodeAsync(string subsectionCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update auto-approval enabled status for a subsection
    /// </summary>
    Task<AutoApprovalConfig> UpdateAsync(Guid id, bool isEnabled, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if auto-approval is enabled for a subsection
    /// </summary>
    Task<bool> IsAutoApprovalEnabledAsync(string subsectionCode, CancellationToken cancellationToken = default);
}
