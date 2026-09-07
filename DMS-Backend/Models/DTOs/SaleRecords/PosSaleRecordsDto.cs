namespace DMS_Backend.Models.DTOs.SaleRecords;

public sealed class PosSaleRecordsDto
{
    public string CashierName { get; set; } = string.Empty;
    public int WeekStartDay { get; set; }
    public int WeeksToShow { get; set; }
    public string PeriodStart { get; set; } = string.Empty;
    public string PeriodEnd { get; set; } = string.Empty;
    public int UnreadCount { get; set; }
    public IReadOnlyList<PosSaleRecordWeekDto> Weeks { get; set; } = Array.Empty<PosSaleRecordWeekDto>();
}

public sealed class PosSaleRecordWeekDto
{
    public string WeekStart { get; set; } = string.Empty;
    public string WeekEnd { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public IReadOnlyList<PosSaleRecordDayDto> Days { get; set; } = Array.Empty<PosSaleRecordDayDto>();
}

public sealed class PosSaleRecordDayDto
{
    public string Date { get; set; } = string.Empty;
    public decimal? Difference { get; set; }
    public string? ShowroomName { get; set; }
    public bool Available { get; set; }
}
