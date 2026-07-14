namespace DMS_Backend.Models.DTOs.SectionConsumables;

public sealed class SectionConsumableListDto
{
    public Guid Id { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal QuantityPerUnit { get; set; }
    public string? Formula { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
