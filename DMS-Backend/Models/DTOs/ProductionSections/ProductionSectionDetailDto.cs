namespace DMS_Backend.Models.DTOs.ProductionSections;

public sealed class ProductionSectionDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public decimal? Capacity { get; set; }
    public int DisplayOrder { get; set; }
    public int ConsumableCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
