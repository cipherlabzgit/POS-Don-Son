using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("product_weight_variants")]
public class ProductWeightVariant : BaseEntity
{
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("label")]
    public string Label { get; set; } = string.Empty;

    [Column("weight_grams", TypeName = "decimal(18,4)")]
    public decimal WeightGrams { get; set; }

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual Product? Product { get; set; }
}
