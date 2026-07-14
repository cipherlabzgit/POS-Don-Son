using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a historical transaction for freezer stock changes.
/// Tracks all additions, deductions, adjustments, and transfers with full audit trail.
/// </summary>
[Table("freezer_stock_history")]
public class FreezerStockHistory : BaseEntity
{
    /// <summary>
    /// The parent freezer stock record this history belongs to.
    /// </summary>
    [Required]
    [Column("freezer_stock_id")]
    public Guid FreezerStockId { get; set; }

    /// <summary>
    /// Date and time of this transaction.
    /// </summary>
    [Required]
    [Column("transaction_date")]
    public DateTime TransactionDate { get; set; }

    /// <summary>
    /// Type of transaction (Addition, Deduction, Adjustment, Transfer).
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("transaction_type")]
    public string TransactionType { get; set; } = string.Empty;

    /// <summary>
    /// Quantity changed (positive for additions, negative for deductions).
    /// </summary>
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; } = 0;

    /// <summary>
    /// Stock level before this transaction.
    /// </summary>
    [Column("previous_stock", TypeName = "decimal(18,4)")]
    public decimal PreviousStock { get; set; } = 0;

    /// <summary>
    /// Stock level after this transaction.
    /// </summary>
    [Column("new_stock", TypeName = "decimal(18,4)")]
    public decimal NewStock { get; set; } = 0;

    /// <summary>
    /// Reason for this transaction.
    /// </summary>
    [Required]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Optional reference number (order no, transfer no, etc.).
    /// </summary>
    [MaxLength(100)]
    [Column("reference_no")]
    public string? ReferenceNo { get; set; }

    // Navigation properties
    public FreezerStock? FreezerStock { get; set; }
}
