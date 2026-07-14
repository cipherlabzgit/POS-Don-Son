namespace DMS_Backend.Models.DTOs.DailyProductions;

/// <summary>
/// Represents a grouped daily production entry in list view.
/// Multiple products with the same ProductionNo/BatchId are grouped as one entry with line items.
/// </summary>
public sealed class DailyProductionListDto
{
    /// <summary>
    /// ID of the first production record in this batch (for navigation/actions).
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Unique production number (shared by all items in this batch).
    /// </summary>
    public string ProductionNo { get; set; } = string.Empty;
    
    /// <summary>
    /// Production date (shared by all items in this batch).
    /// </summary>
    public DateTime ProductionDate { get; set; }
    
    /// <summary>
    /// Shift information (shared by all items in this batch).
    /// </summary>
    public Guid ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    
    /// <summary>
    /// Status (shared by all items in this batch).
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    /// <summary>
    /// Batch ID that groups multiple products together.
    /// </summary>
    public Guid? BatchId { get; set; }
    
    /// <summary>
    /// Number of different products in this batch.
    /// </summary>
    public int TotalItems { get; set; }
    
    /// <summary>
    /// Sum of produced quantities across all products in this batch.
    /// </summary>
    public decimal TotalProducedQty { get; set; }
    
    /// <summary>
    /// Individual product line items in this batch.
    /// </summary>
    public List<DailyProductionLineItemDto> Lines { get; set; } = new();
    
    /// <summary>
    /// Audit information.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
}
