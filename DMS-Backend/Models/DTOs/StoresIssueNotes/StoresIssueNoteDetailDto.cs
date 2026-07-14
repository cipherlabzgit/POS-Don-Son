using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class StoresIssueNoteDetailDto
{
    public Guid Id { get; set; }
    public string IssueNoteNo { get; set; } = string.Empty;
    public Guid ProductionPlanId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public StoresIssueNoteStatus Status { get; set; }
    public Guid? IssuedBy { get; set; }
    public string IssuedByName { get; set; } = string.Empty;
    public Guid? ReceivedBy { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public DateTime? ReceivedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<StoresIssueNoteItemDto> Items { get; set; } = new();
}
