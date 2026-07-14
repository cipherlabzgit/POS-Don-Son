namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ProductionPlanItemDto
{
    public Guid Id { get; set; }
    public Guid ProductionPlanId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal RegularFullQty { get; set; }
    public decimal RegularMiniQty { get; set; }
    public decimal CustomizedFullQty { get; set; }
    public decimal CustomizedMiniQty { get; set; }
    public decimal FreezerStock { get; set; }
    public decimal ProduceQty { get; set; }
    public bool IsExcluded { get; set; }
    public List<ProductionAdjustmentDto> Adjustments { get; set; } = new();
}
