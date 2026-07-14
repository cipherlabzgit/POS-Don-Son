namespace DMS_Backend.Models.DTOs.ProductionSections;

public sealed class CreateProductionSectionDto
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public decimal? Capacity { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
