using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>POS / showroom sale approval workflow (mirrors Stock BF pattern).</summary>
public enum PosSaleStatus
{
    Pending,
    Approved,
    Rejected,
    Voided,
}

[Table("pos_sales")]
public sealed class PosSale : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("sale_no")]
    public string SaleNo { get; set; } = string.Empty;

    [Required]
    [Column("sold_at")]
    public DateTime SoldAt { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [Required]
    [Column("total_amount", TypeName = "decimal(18,4)")]
    public decimal TotalAmount { get; set; }

    /// <summary>Optional idempotency key from POS clients (offline sync).</summary>
    [MaxLength(80)]
    [Column("client_mutation_id")]
    public string? ClientMutationId { get; set; }

    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Required]
    [Column("status")]
    public PosSaleStatus Status { get; set; } = PosSaleStatus.Pending;

    [Column("approved_by_id")]
    public Guid? ApprovedById { get; set; }

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [Column("rejected_by_id")]
    public Guid? RejectedById { get; set; }

    [Column("rejected_at")]
    public DateTime? RejectedAt { get; set; }

    [MaxLength(500)]
    [Column("rejection_reason")]
    public string? RejectionReason { get; set; }

    public Outlet Outlet { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public User? RejectedBy { get; set; }
    public ICollection<PosSaleLine> Lines { get; set; } = new List<PosSaleLine>();
}

[Table("pos_sale_lines")]
public sealed class PosSaleLine : BaseEntity
{
    [Required]
    [Column("pos_sale_id")]
    public Guid PosSaleId { get; set; }

    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Required]
    [Column("quantity", TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Required]
    [Column("unit_price", TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    [Required]
    [Column("line_total", TypeName = "decimal(18,4)")]
    public decimal LineTotal { get; set; }

    public PosSale PosSale { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
