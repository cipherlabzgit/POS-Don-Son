using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents opening stock balances (Brought Forward) per showroom per product.
/// </summary>
[Table("stock_bf")]
public class StockBF : BaseEntity
{
    /// <summary>
    /// Unique BF number (auto-generated: SBF########).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("bf_no")]
    public string BFNo { get; set; } = string.Empty;

    /// <summary>
    /// The date for this BF stock entry.
    /// </summary>
    [Required]
    [Column("bf_date")]
    public DateTime BFDate { get; set; }

    /// <summary>
    /// The outlet (showroom) for this stock.
    /// </summary>
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    /// <summary>
    /// The product for this stock.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Opening stock quantity.
    /// </summary>
    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// Current status of the stock BF.
    /// </summary>
    [Required]
    [Column("status")]
    public StockBFStatus Status { get; set; } = StockBFStatus.Draft;

    /// <summary>
    /// Optional idempotency key from POS clients (offline sync). All records in a bulk submission share the same mutation ID.
    /// </summary>
    [MaxLength(80)]
    [Column("client_mutation_id")]
    public string? ClientMutationId { get; set; }

    /// <summary>
    /// User who approved this stock BF.
    /// </summary>
    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    /// <summary>
    /// Date and time when stock BF was approved.
    /// </summary>
    [Column("approved_date")]
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// User who rejected this stock BF.
    /// </summary>
    [Column("rejected_by_id")]
    public Guid? RejectedById { get; set; }

    /// <summary>
    /// Date and time when stock BF was rejected.
    /// </summary>
    [Column("rejected_date")]
    public DateTime? RejectedDate { get; set; }

    // Navigation properties
    public Outlet Outlet { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public User? RejectedBy { get; set; }
}

/// <summary>
/// Status values for stock BF records (approval workflow).
/// </summary>
public enum StockBFStatus
{
    /// <summary>Awaiting approval.</summary>
    Pending,
    Approved,
    Rejected,
    /// <summary>Legacy / inventory correction label.</summary>
    Adjusted,
    /// <summary>Editable by creator; use submit to queue for approval.</summary>
    Draft,
}
