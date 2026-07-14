namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class ComputeProductionPlanResponseDto
{
    public Guid DeliveryPlanId { get; set; }
    public bool UseFreezerStock { get; set; }
    public List<ComputedProductionItemDto> Items { get; set; } = new();
    public int TotalProducts { get; set; }
    public decimal TotalQuantity { get; set; }
}

public class ComputedProductionItemDto
{
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal RegularFullQty { get; set; }
    public decimal RegularMiniQty { get; set; }
    public decimal CustomizedFullQty { get; set; }
    public decimal CustomizedMiniQty { get; set; }
    public decimal TotalRequiredQty { get; set; }
    public decimal FreezerStock { get; set; }
    public decimal StandardQty { get; set; }
    public decimal ProduceQty { get; set; }
    public decimal StoresQty { get; set; }
}
