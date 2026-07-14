namespace DMS_Backend.Models.DTOs.ShowroomLabelRequest;

public sealed class ShowroomLabelRequestListDto
{
    public Guid Id { get; set; }
    public string DisplayNo { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public string Text1 { get; set; } = string.Empty;
    public string? Text2 { get; set; }
    public int LabelCount { get; set; }
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
