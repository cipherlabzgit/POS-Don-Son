namespace DMS_Backend.Models.DTOs.DayEnd;

public sealed class DayEndOutletRowDto
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public decimal SystemBalance { get; set; }
    /// <summary>Pending until a day-end line exists for this outlet and date; then Completed.</summary>
    public string RowStatus { get; set; } = "Pending";
}
