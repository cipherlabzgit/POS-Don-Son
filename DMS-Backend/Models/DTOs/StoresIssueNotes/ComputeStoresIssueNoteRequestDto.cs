namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class ComputeStoresIssueNoteRequestDto
{
    public Guid ProductionPlanId { get; set; }
    public Guid ProductionSectionId { get; set; }
}
