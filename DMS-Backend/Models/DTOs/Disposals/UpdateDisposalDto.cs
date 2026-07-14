namespace DMS_Backend.Models.DTOs.Disposals;

public sealed class UpdateDisposalDto
{
    public required DateTime DisposalDate { get; set; }
    public required Guid OutletId { get; set; }
    public string? Notes { get; set; }
    public List<UpdateDisposalItemDto> Items { get; set; } = new();
}

public sealed class UpdateDisposalItemDto
{
    public Guid? Id { get; set; }
    public required Guid ProductId { get; set; }
    public required decimal Quantity { get; set; }
    public string? Reason { get; set; }
}
