using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public enum ReconciliationStatus
{
    InProgress,
    Submitted,
    Approved
}

public class Reconciliation
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    public string ReconciliationNo { get; set; } = string.Empty;

    [Required]
    public DateTime ReconciliationDate { get; set; }

    [Required]
    public Guid DeliveryPlanId { get; set; }

    [Required]
    public Guid OutletId { get; set; }

    [Required]
    public ReconciliationStatus Status { get; set; } = ReconciliationStatus.InProgress;

    public Guid? SubmittedBy { get; set; }

    public DateTime? SubmittedAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual DeliveryPlan? DeliveryPlan { get; set; }
    public virtual Outlet? Outlet { get; set; }
    public virtual ICollection<ReconciliationItem> ReconciliationItems { get; set; } = new List<ReconciliationItem>();
}
