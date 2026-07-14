using DMS_Backend.Models.DTOs.WorkflowConfigs;

namespace DMS_Backend.Services.Interfaces;

public interface IWorkflowConfigService
{
    Task<(List<WorkflowConfigListDto> workflowConfigs, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<WorkflowConfigDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<WorkflowConfigDetailDto> CreateAsync(WorkflowConfigCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<WorkflowConfigDetailDto> UpdateAsync(Guid id, WorkflowConfigUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns true when the workflow config for the given code exists, is active/enabled, and RequiresApproval = true.
    /// Returns false (bypass approval) when the config is disabled, inactive, or RequiresApproval = false.
    /// </summary>
    Task<bool> IsApprovalRequiredAsync(string workflowCode, CancellationToken cancellationToken = default);
}
