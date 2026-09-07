namespace DMS_Backend.Models.DTOs.SaleRecords;

public sealed class NotifyCashiersDto
{
    public DateTime ProcessDate { get; set; }
    public List<Guid> OutletIds { get; set; } = new();
    public bool ConfirmRenotify { get; set; }
}
