using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents current freezer stock levels per product and production section.
/// Tracks real-time inventory with history tracking via FreezerStockHistory.
/// </summary>
[Table("freezer_stocks")]
public class FreezerStock : BaseEntity
{
    /// <summary>
    /// The product this stock record is for.
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// The production section where this stock is stored.
    /// </summary>
    [Required]
    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }

    /// <summary>
    /// Current stock quantity.
    /// </summary>
    [Column("current_stock", TypeName = "decimal(18,4)")]
    public decimal CurrentStock { get; set; } = 0;

    /// <summary>
    /// User who last updated this stock record.
    /// </summary>
    [Required]
    [Column("last_updated_by")]
    public Guid LastUpdatedBy { get; set; }

    /// <summary>
    /// Timestamp of last update.
    /// </summary>
    [Required]
    [Column("last_updated_at")]
    public DateTime LastUpdatedAt { get; set; }

    // Navigation properties
    public Product? Product { get; set; }
    public ProductionSection? ProductionSection { get; set; }
    public User? LastUpdatedByUser { get; set; }
    public ICollection<FreezerStockHistory> StockHistory { get; set; } = new List<FreezerStockHistory>();
}
