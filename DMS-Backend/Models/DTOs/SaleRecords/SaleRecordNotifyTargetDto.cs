namespace DMS_Backend.Models.DTOs.SaleRecords;

public sealed class SaleRecordNotifyTargetDto
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public Guid? OutletEmployeeId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public bool AlreadyNotified { get; set; }
    public bool CanNotify { get; set; }
    public string Status { get; set; } = "Locked";
}
