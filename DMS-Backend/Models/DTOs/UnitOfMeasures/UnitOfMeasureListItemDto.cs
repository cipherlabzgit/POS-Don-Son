namespace DMS_Backend.Models.DTOs.UnitOfMeasures;

public class UnitOfMeasureListItemDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public int IngredientCount { get; set; }
}
