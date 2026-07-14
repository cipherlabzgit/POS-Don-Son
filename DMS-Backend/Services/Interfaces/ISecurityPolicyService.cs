using DMS_Backend.Models.DTOs.SecurityPolicies;

namespace DMS_Backend.Services.Interfaces;

public interface ISecurityPolicyService
{
    Task<(List<SecurityPolicyListDto> securityPolicies, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default);

    Task<SecurityPolicyDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<SecurityPolicyDetailDto> CreateAsync(SecurityPolicyCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<SecurityPolicyDetailDto> UpdateAsync(Guid id, SecurityPolicyUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<bool> PolicyKeyExistsAsync(string policyKey, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
