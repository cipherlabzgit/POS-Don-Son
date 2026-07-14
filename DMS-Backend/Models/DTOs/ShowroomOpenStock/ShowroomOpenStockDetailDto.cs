namespace DMS_Backend.Models.DTOs.ShowroomOpenStock;

public sealed class ShowroomOpenStockDetailDto
{
    /// <summary>Same as <see cref="OutletId"/>.</summary>
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    /// <summary>Latest approved/adjusted Stock BF date; null if none.</summary>
    public DateTime? StockAsAt { get; set; }
    public int? BfLineCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}
