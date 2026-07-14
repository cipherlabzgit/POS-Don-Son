using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class UpdateStoresIssueNoteDto
{
    public DateTime? IssueDate { get; set; }
    public StoresIssueNoteStatus? Status { get; set; }
    public List<UpdateStoresIssueNoteItemDto>? Items { get; set; }
}

public class UpdateStoresIssueNoteItemDto
{
    public Guid Id { get; set; }
    public decimal? ExtraQty { get; set; }
    public string? Notes { get; set; }
}
