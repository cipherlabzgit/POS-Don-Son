namespace DMS_Backend.Models.DTOs.LabelPrintRequests;

public sealed class LabelPrintRequestListDto
{
    public Guid Id { get; set; }
    public string DisplayNo { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public int LabelCount { get; set; }
    public DateTime StartDate { get; set; }
    public int ExpiryDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedById { get; set; }
    public Guid UpdatedById { get; set; }
    public string? UpdatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectedByName { get; set; }
    public DateTime? RejectedDate { get; set; }
}
