using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public enum StoresIssueNoteStatus
{
    Draft,
    Issued,
    Received,
    Pending,
}

public class StoresIssueNote
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    public string IssueNoteNo { get; set; } = string.Empty;

    [Required]
    public Guid ProductionPlanId { get; set; }

    [Required]
    public Guid ProductionSectionId { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public StoresIssueNoteStatus Status { get; set; } = StoresIssueNoteStatus.Draft;

    public Guid? IssuedBy { get; set; }

    public Guid? ReceivedBy { get; set; }

    public DateTime? ReceivedAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ProductionPlan? ProductionPlan { get; set; }
    public virtual ProductionSection? ProductionSection { get; set; }
    public virtual ICollection<StoresIssueNoteItem> StoresIssueNoteItems { get; set; } = new List<StoresIssueNoteItem>();
}
