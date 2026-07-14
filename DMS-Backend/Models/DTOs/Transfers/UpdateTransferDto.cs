namespace DMS_Backend.Models.DTOs.Transfers;

public sealed class UpdateTransferDto
{
    public required DateTime TransferDate { get; set; }
    public required Guid FromOutletId { get; set; }
    public required Guid ToOutletId { get; set; }
    public string? Notes { get; set; }
    public List<UpdateTransferItemDto> Items { get; set; } = new();
}

public sealed class UpdateTransferItemDto
{
    public Guid? Id { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
}
