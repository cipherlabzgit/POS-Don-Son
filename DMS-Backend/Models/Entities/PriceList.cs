using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Price list header for managing different pricing schemes.
/// </summary>
[Table("price_lists")]
public class PriceList : BaseEntity
{
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Price list type (e.g., "Standard", "Wholesale", "Retail", "Promotional")
    /// </summary>
    [MaxLength(50)]
    [Column("price_list_type")]
    public string? PriceListType { get; set; }

    /// <summary>
    /// Currency code (e.g., "INR", "USD")
    /// </summary>
    [MaxLength(3)]
    [Column("currency")]
    public string Currency { get; set; } = "INR";

    /// <summary>
    /// Effective from date
    /// </summary>
    [Column("effective_from")]
    public DateTime EffectiveFrom { get; set; }

    /// <summary>
    /// Effective to date (null = indefinite)
    /// </summary>
    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    /// <summary>
    /// Is default price list
    /// </summary>
    [Column("is_default")]
    public bool IsDefault { get; set; }

    /// <summary>
    /// Priority for selection (lower = higher priority)
    /// </summary>
    [Column("priority")]
    public int Priority { get; set; }

    /// <summary>
    /// Navigation to price items
    /// </summary>
    public ICollection<PriceListItem>? PriceListItems { get; set; }
}

/// <summary>
/// Individual price entries for products in a price list.
/// </summary>
[Table("price_list_items")]
public class PriceListItem : BaseEntity
{
    [Column("price_list_id")]
    public Guid PriceListId { get; set; }
    
    public PriceList PriceList { get; set; } = null!;

    [Column("product_id")]
    public Guid ProductId { get; set; }
    
    public Product Product { get; set; } = null!;

    /// <summary>
    /// Unit price for this product in this price list
    /// </summary>
    [Column("unit_price", TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Discount percentage (optional)
    /// </summary>
    [Column("discount_percentage", TypeName = "decimal(5,2)")]
    public decimal? DiscountPercentage { get; set; }

    /// <summary>
    /// Minimum order quantity
    /// </summary>
    [Column("min_quantity", TypeName = "decimal(18,4)")]
    public decimal? MinQuantity { get; set; }

    /// <summary>
    /// Maximum order quantity
    /// </summary>
    [Column("max_quantity", TypeName = "decimal(18,4)")]
    public decimal? MaxQuantity { get; set; }
}
