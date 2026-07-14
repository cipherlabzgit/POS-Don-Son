namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class ComputeStoresIssueNoteResponseDto
{
    public Guid ProductionPlanId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    /// <summary>
    /// Product-wise breakdown of ingredients for this section.
    /// Each product in this section has its own ingredient list.
    /// </summary>
    public List<SectionProductBreakdownDto> ProductBreakdowns { get; set; } = new();
    /// <summary>
    /// Aggregated ingredient totals across all products in this section.
    /// Used for the section summary row on the stores sheet.
    /// </summary>
    public List<ComputedIngredientDto> Ingredients { get; set; } = new();
}

/// <summary>
/// Ingredient list for one product within a section (e.g., "Egg Bun — Bakery Section").
/// </summary>
public class SectionProductBreakdownDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public List<ComputedIngredientDto> Ingredients { get; set; } = new();
}

public class ComputedIngredientDto
{
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    /// <summary>Net production quantity (what production uses). Does NOT include extra.</summary>
    public decimal ProductionQty { get; set; }
    public decimal ExtraPercentage { get; set; }
    /// <summary>
    /// Extra quantity for waste/cleaning loss.
    /// Displayed on the STORES sheet only — production sees only ProductionQty.
    /// </summary>
    public decimal ExtraQty { get; set; }
    /// <summary>TotalQty = ProductionQty + ExtraQty. What stores physically issues.</summary>
    public decimal TotalQty { get; set; }
    public List<string> UsedInProducts { get; set; } = new();
    /// <summary>Recipe component this ingredient belongs to (e.g., "Dough", "Filling", "Garnish").</summary>
    public string? RecipeComponentName { get; set; }
    public Guid? RecipeComponentId { get; set; }
}
