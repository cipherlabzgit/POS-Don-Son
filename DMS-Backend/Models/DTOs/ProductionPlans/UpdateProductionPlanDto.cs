using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.ProductionPlans;

public class UpdateProductionPlanDto
{
    public ProductionPlanStatus? Status { get; set; }
    public bool? UseFreezerStock { get; set; }
    public List<UpdateProductionPlanItemDto>? Items { get; set; }
}

public class UpdateProductionPlanItemDto
{
    public Guid Id { get; set; }
    public decimal? ProduceQty { get; set; }
    public bool? IsExcluded { get; set; }
}
