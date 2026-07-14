namespace DMS_Backend.Models.DTOs.PosSales;

public sealed class CreatePosSaleDto
{
    public required Guid OutletId { get; set; }

    /// <summary>Defaults to UTC now when omitted.</summary>
    public DateTime? SoldAt { get; set; }

    public required string PaymentMethod { get; set; }

    /// <summary>Stable UUID from POS for idempotent replay after offline sync.</summary>
    public string? ClientMutationId { get; set; }

    public required IReadOnlyList<CreatePosSaleLineDto> Lines { get; set; }
}

public sealed class CreatePosSaleLineDto
{
    public required Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
