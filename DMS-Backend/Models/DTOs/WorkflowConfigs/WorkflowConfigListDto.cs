namespace DMS_Backend.Models.DTOs.WorkflowConfigs;

public class WorkflowConfigListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string WorkflowType { get; set; } = "Approval";
    public bool RequiresApproval { get; set; }
    public int ApprovalLevels { get; set; }
    public bool IsEnabled { get; set; }
    public bool IsActive { get; set; }
}
