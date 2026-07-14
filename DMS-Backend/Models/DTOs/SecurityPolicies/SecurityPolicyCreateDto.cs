namespace DMS_Backend.Models.DTOs.SecurityPolicies;

public class SecurityPolicyCreateDto
{
    public string PolicyKey { get; set; } = string.Empty;
    public string PolicyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? PolicyValue { get; set; }
    public string ValueType { get; set; } = "String";
    public bool IsEnforced { get; set; } = true;
    public bool IsSystemPolicy { get; set; }
    public string? SeverityLevel { get; set; }
    public DateTime? LastReviewedAt { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
