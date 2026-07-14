namespace DMS_Backend.Models.DTOs.Reconciliations;

public class UpdateActualQuantitiesDto
{
    public List<ActualQuantityItemDto> Items { get; set; } = new();
}

public class ActualQuantityItemDto
{
    public Guid ItemId { get; set; }
    public decimal ActualQty { get; set; }
    public string? Reason { get; set; }
}
