namespace DMS_Backend.Models.DTOs.PosSales;

public sealed class CreateBulkPosSalesDto
{
    public required List<CreatePosSaleDto> Sales { get; set; }
}

public sealed class BulkPosSaleResultDto
{
    public required List<PosSaleDetailDto> Sales { get; set; }
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public List<BulkSaleError>? Errors { get; set; }
}

public sealed class BulkSaleError
{
    public string? ClientMutationId { get; set; }
    public required string Message { get; set; }
}
