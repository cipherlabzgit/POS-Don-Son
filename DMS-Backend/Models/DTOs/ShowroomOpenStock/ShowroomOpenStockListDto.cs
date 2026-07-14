namespace DMS_Backend.Models.DTOs.ShowroomOpenStock;

public sealed class ShowroomOpenStockListDto
{
    /// <summary>List row id (same as OutletId) for edit/navigation.</summary>
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    /// <summary>Latest approved/adjusted Stock BF date for this showroom; null if none.</summary>
    public DateTime? StockAsAt { get; set; }
    public int? BfLineCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}
