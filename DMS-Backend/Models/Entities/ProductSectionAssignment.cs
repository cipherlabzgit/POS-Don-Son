using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Join table: one product can belong to many production sections.
/// The optional Role describes what the product does in that section
/// (e.g. "Bun dough" for Bakery, "Filling (egg)" for Filling Section).
/// </summary>
[Table("product_section_assignments")]
public class ProductSectionAssignment
{
    // Table was created via raw SQL (migration 20260508190000_AddProductSectionAssignments)
    // with a lowercase 'id' primary key, not the EF default '"Id"'. Map explicitly so
    // generated SQL (e.g. ORDER BY s."Id") doesn't fail with "column p1.Id does not exist".
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("product_id")]
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    [Column("production_section_id")]
    public Guid ProductionSectionId { get; set; }
    public virtual ProductionSection ProductionSection { get; set; } = null!;

    /// <summary>
    /// Describes the role this product plays in the section.
    /// e.g. "Bun dough", "Filling (egg)", "Bread", "Toppings".
    /// </summary>
    [MaxLength(100)]
    [Column("role")]
    public string? Role { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;
}
