namespace DMS_Backend.Models.DTOs.SecurityPolicies;

public class SecurityPolicyListDto
{
    public Guid Id { get; set; }
    public string PolicyKey { get; set; } = string.Empty;
    public string PolicyName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ValueType { get; set; } = "String";
    public bool IsEnforced { get; set; }
    public bool IsSystemPolicy { get; set; }
    public string? SeverityLevel { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
