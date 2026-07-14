namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class CreateProductionPlanDto
{
    public Guid DeliveryPlanId { get; set; }
    public bool UseFreezerStock { get; set; }
    public List<CreateProductionPlanItemDto> Items { get; set; } = new();
}

public class CreateProductionPlanItemDto
{
    public Guid ProductionSectionId { get; set; }
    public Guid ProductId { get; set; }
    public decimal RegularFullQty { get; set; }
    public decimal RegularMiniQty { get; set; }
    public decimal CustomizedFullQty { get; set; }
    public decimal CustomizedMiniQty { get; set; }
    public decimal FreezerStock { get; set; }
    public decimal ProduceQty { get; set; }
    public bool IsExcluded { get; set; }
}
