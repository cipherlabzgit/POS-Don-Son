namespace DMS_Backend.Models.DTOs.Transfers;

public sealed class CreateTransferDto
{
    public required DateTime TransferDate { get; set; }
    public required Guid FromOutletId { get; set; }
    public required Guid ToOutletId { get; set; }
    public string? Notes { get; set; }
    public List<CreateTransferItemDto> Items { get; set; } = new();
}

public sealed class CreateTransferItemDto
{
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
}
