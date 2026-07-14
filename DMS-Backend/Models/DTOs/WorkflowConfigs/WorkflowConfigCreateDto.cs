namespace DMS_Backend.Models.DTOs.WorkflowConfigs;

public class WorkflowConfigCreateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string WorkflowType { get; set; } = "Approval";
    public bool RequiresApproval { get; set; } = true;
    public int ApprovalLevels { get; set; } = 1;
    public decimal? AutoApproveThreshold { get; set; }
    public string? ApprovalSteps { get; set; }
    public string? NotificationSettings { get; set; }
    public int? TimeoutHours { get; set; }
    public string? EscalationConfig { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
