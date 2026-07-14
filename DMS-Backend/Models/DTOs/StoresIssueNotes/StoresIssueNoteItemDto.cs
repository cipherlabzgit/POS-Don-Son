namespace DMS_Backend.Models.DTOs.StoresIssueNotes;

public class StoresIssueNoteItemDto
{
    public Guid Id { get; set; }
    public Guid StoresIssueNoteId { get; set; }
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    /// <summary>Net production quantity. This is what production uses — does NOT include extra/waste.</summary>
    public decimal ProductionQty { get; set; }
    /// <summary>
    /// Extra quantity for waste/cleaning loss (e.g., carrot weight reduction after cleaning).
    /// Displayed on stores sheet only — production always sees ProductionQty.
    /// </summary>
    public decimal ExtraQty { get; set; }
    /// <summary>TotalQty = ProductionQty + ExtraQty. This is what stores physically issues.</summary>
    public decimal TotalQty { get; set; }
    public string? Notes { get; set; }
    /// <summary>
    /// Which product this ingredient line belongs to within the section.
    /// Enables item-wise breakdown on the stores sheet.
    /// Null for section-level consumables.
    /// </summary>
    public Guid? ProductId { get; set; }
    public string? ProductCode { get; set; }
    public string? ProductName { get; set; }
    /// <summary>Which recipe component this came from (e.g., "Dough", "Filling", "Garnish").</summary>
    public Guid? RecipeComponentId { get; set; }
    public string? RecipeComponentName { get; set; }
}
