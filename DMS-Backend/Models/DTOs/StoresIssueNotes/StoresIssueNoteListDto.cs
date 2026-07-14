using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class StoresIssueNoteListDto
{
    public Guid Id { get; set; }
    public string IssueNoteNo { get; set; } = string.Empty;
    public Guid ProductionPlanId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public StoresIssueNoteStatus Status { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
