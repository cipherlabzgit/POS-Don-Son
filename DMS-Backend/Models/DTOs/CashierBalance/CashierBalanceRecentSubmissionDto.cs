namespace DMS_Backend.Models.DTOs.CashierBalance;

public sealed class CashierBalanceRecentSubmissionDto
{
    public DateTime ProcessDate { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? SubmittedByName { get; set; }
    public int ClosedShowroomCount { get; set; }
    public decimal TotalBalance { get; set; }
}
