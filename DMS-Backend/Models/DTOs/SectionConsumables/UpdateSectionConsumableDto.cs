namespace DMS_Backend.Models.DTOs.SectionConsumables;

public sealed class UpdateSectionConsumableDto
{
    public required Guid ProductionSectionId { get; set; }
    public required Guid IngredientId { get; set; }
    public required decimal QuantityPerUnit { get; set; }
    public string? Formula { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}
