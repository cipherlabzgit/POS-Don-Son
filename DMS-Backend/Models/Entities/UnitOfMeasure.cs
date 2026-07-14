using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public class UnitOfMeasure : BaseEntity
{
    [Required]
    [MaxLength(10)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Description { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<Product>? Products { get; set; }
    public ICollection<Ingredient>? Ingredients { get; set; }
}
