using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Tracks whether cashier balances for all showrooms have been approved for a given process date.
/// Day-End Process is blocked until this is approved for the selected date.
/// </summary>
[Table("cashier_balance_days")]
public sealed class CashierBalanceDay
{
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>Business date (UTC midnight).</summary>
    [Column("process_date")]
    public DateTime ProcessDate { get; set; }

    [Column("is_approved")]
    public bool IsApproved { get; set; }

    [Column("is_submitted")]
    public bool IsSubmitted { get; set; }

    [Column("submitted_at")]
    public DateTime? SubmittedAt { get; set; }

    [Column("submitted_by_id")]
    public Guid? SubmittedById { get; set; }

    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public User? ApprovedBy { get; set; }

    public User? SubmittedBy { get; set; }
}
