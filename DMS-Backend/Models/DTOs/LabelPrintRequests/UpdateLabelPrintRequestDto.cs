namespace DMS_Backend.Models.DTOs.LabelPrintRequests;

public sealed class UpdateLabelPrintRequestDto
{
    public required DateTime Date { get; set; }
    public required Guid ProductId { get; set; }
    public required int LabelCount { get; set; }
    public required DateTime StartDate { get; set; }
    public required int ExpiryDays { get; set; }
    public decimal? PriceOverride { get; set; }
}
