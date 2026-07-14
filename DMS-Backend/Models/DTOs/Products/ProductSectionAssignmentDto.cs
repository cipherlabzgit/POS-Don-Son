namespace DMS_Backend.Models.DTOs.Products;

public class ProductSectionAssignmentDto
{
    public Guid Id { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionCode { get; set; } = string.Empty;
    public string ProductionSectionName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public int SortOrder { get; set; }
}

public class UpsertProductSectionAssignmentDto
{
    public Guid ProductionSectionId { get; set; }
    public string? Role { get; set; }
    public int SortOrder { get; set; } = 0;
}
