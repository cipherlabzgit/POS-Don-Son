namespace DMS_Backend.Models.DTOs.ProductionSections;

public sealed class UpdateProductionSectionDto
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public decimal? Capacity { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}
