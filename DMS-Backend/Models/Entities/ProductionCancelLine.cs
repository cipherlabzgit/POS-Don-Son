using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents individual line items in a production cancellation.
/// </summary>
[Table("production_cancel_lines")]
public class ProductionCancelLine : BaseEntity
{
    /// <summary>
    /// Reference to the parent production cancellation.
    /// </summary>
    [Required]
    [Column("production_cancel_id")]
    public Guid ProductionCancelId { get; set; }

    /// <summary>
    /// Navigation property to parent cancellation.
    /// </summary>
    [ForeignKey(nameof(ProductionCancelId))]
    public ProductionCancel ProductionCancel { get; set; } = null!;

    /// <summary>
    /// Product being cancelled in this line.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Navigation property to product.
    /// </summary>
    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;

    /// <summary>
    /// Production section where the product was produced.
    /// </summary>
    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    /// <summary>
    /// Navigation property to production section.
    /// </summary>
    [ForeignKey(nameof(ProductionSectionId))]
    public ProductionSection ProductionSection { get; set; } = null!;

    /// <summary>
    /// Quantity being cancelled for this product.
    /// </summary>
    [Required]
    [Column("cancelled_qty")]
    public decimal CancelledQty { get; set; }

    /// <summary>
    /// Line number for ordering (1, 2, 3, etc.).
    /// </summary>
    [Required]
    [Column("line_no")]
    public int LineNo { get; set; }
}
