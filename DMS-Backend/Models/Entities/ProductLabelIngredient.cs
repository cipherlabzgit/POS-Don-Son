using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

[Table("product_label_ingredients")]
public class ProductLabelIngredient
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("product_id")]
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    [Column("ingredient_id")]
    public Guid IngredientId { get; set; }
    public virtual Ingredient Ingredient { get; set; } = null!;

    [Column("sort_order")]
    public int SortOrder { get; set; }
}
