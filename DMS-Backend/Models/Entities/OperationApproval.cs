using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Immutable audit record for every workflow status transition across all DMS documents.
/// Records who changed status, from/to what, when, and any remarks.
/// One record per transition — never updated.
/// </summary>
[Table("operation_approvals")]
public class OperationApproval : BaseEntity
{
    /// <summary>Which document type this transition belongs to (e.g., "DeliveryPlan", "Order", "ImmediateOrder", "ProductionPlan", "StoresIssueNote").</summary>
    [Required]
    [MaxLength(100)]
    [Column("document_type")]
    public string DocumentType { get; set; } = string.Empty;

    /// <summary>The ID of the affected document.</summary>
    [Required]
    [Column("document_id")]
    public Guid DocumentId { get; set; }

    /// <summary>Human-readable document reference number (e.g., "DP-2025-000123").</summary>
    [MaxLength(100)]
    [Column("document_no")]
    public string? DocumentNo { get; set; }

    /// <summary>Status before this transition.</summary>
    [Required]
    [MaxLength(50)]
    [Column("from_status")]
    public string FromStatus { get; set; } = string.Empty;

    /// <summary>Status after this transition.</summary>
    [Required]
    [MaxLength(50)]
    [Column("to_status")]
    public string ToStatus { get; set; } = string.Empty;

    /// <summary>User who performed the transition.</summary>
    [Required]
    [Column("performed_by")]
    public Guid PerformedBy { get; set; }

    /// <summary>When the transition occurred (UTC).</summary>
    [Required]
    [Column("performed_at")]
    public DateTime PerformedAt { get; set; }

    /// <summary>Optional remarks provided by the user (e.g., rejection reason, approval notes).</summary>
    [MaxLength(1000)]
    [Column("remarks")]
    public string? Remarks { get; set; }

    /// <summary>Action label shown in audit timeline (e.g., "Approved", "Rejected", "Submitted", "Issued").</summary>
    [Required]
    [MaxLength(100)]
    [Column("action")]
    public string Action { get; set; } = string.Empty;

    // Navigation
    public virtual User? PerformedByUser { get; set; }
}
