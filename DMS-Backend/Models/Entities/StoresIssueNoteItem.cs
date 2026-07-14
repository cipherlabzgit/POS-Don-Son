using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

public class StoresIssueNoteItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid StoresIssueNoteId { get; set; }

    [Required]
    public Guid IngredientId { get; set; }

    /// <summary>
    /// The product this ingredient line belongs to within the section.
    /// Enables item-wise breakdown on the stores sheet
    /// (e.g., "For Egg Bun — Flour 2kg, Sugar 0.5kg" vs "For Hotdog Bun — Flour 1.5kg").
    /// Nullable for section-level consumables not tied to a specific product.
    /// </summary>
    [Column("product_id")]
    public Guid? ProductId { get; set; }

    /// <summary>
    /// The recipe component this ingredient was sourced from.
    /// Allows the stores sheet to display the component name (e.g., "Dough", "Filling", "Garnish").
    /// </summary>
    [Column("recipe_component_id")]
    public Guid? RecipeComponentId { get; set; }

    /// <summary>Net production quantity (does not include extra/waste allowance).</summary>
    public decimal ProductionQty { get; set; }

    /// <summary>
    /// Extra quantity added for waste/cleaning loss (e.g., carrot weight loss after cleaning).
    /// This is ONLY displayed on the stores sheet — production sees ProductionQty only.
    /// </summary>
    public decimal ExtraQty { get; set; }

    /// <summary>TotalQty = ProductionQty + ExtraQty. Stores issue this amount.</summary>
    public decimal TotalQty { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual StoresIssueNote? StoresIssueNote { get; set; }
    public virtual Ingredient? Ingredient { get; set; }
    public virtual Product? Product { get; set; }
    public virtual RecipeComponent? RecipeComponent { get; set; }
}
