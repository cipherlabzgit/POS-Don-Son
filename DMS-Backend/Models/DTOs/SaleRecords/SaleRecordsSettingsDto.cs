namespace DMS_Backend.Models.DTOs.SaleRecords;

public sealed class SaleRecordsSettingsDto
{
    public int WeekStartDay { get; set; }
    public string WeekStartDayName { get; set; } = string.Empty;
    public int WeeksToShow { get; set; }
}
