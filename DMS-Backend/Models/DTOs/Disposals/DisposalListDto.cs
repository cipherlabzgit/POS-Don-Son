namespace DMS_Backend.Models.DTOs.Disposals;

public sealed class DisposalListDto
{
    public Guid Id { get; set; }
    public string DisposalNo { get; set; } = string.Empty;
    public DateTime DisposalDate { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime UpdatedAt { get; set; }
}
