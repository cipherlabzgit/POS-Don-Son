namespace DMS_Backend.Models.DTOs.Transfers;

public sealed class TransferListDto
{
    public Guid Id { get; set; }
    public string TransferNo { get; set; } = string.Empty;
    public DateTime TransferDate { get; set; }
    public Guid FromOutletId { get; set; }
    public string FromOutletName { get; set; } = string.Empty;
    public Guid ToOutletId { get; set; }
    public string ToOutletName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime UpdatedAt { get; set; }
}
