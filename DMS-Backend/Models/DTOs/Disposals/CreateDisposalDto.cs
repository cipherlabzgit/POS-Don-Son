namespace DMS_Backend.Models.DTOs.Disposals;

public sealed class CreateDisposalDto
{
    public required DateTime DisposalDate { get; set; }
    public required Guid OutletId { get; set; }
    public string? Notes { get; set; }
    public List<CreateDisposalItemDto> Items { get; set; } = new();
}

public sealed class CreateDisposalItemDto
{
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
    public string? Reason { get; set; }
}
