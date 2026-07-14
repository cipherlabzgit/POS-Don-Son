namespace DMS_Backend.Models.DTOs.DeliveryPlans;

public sealed class OutletDeliveryScheduleDto
{
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public List<OutletTurnScheduleDto> Turns { get; set; } = new();
}

public sealed class OutletTurnScheduleDto
{
    public Guid DeliveryTurnId { get; set; }
    public string DeliveryTurnName { get; set; } = string.Empty;
    public Guid DeliveryPlanId { get; set; }
    public string PlanNo { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<OutletScheduleProductDto> Products { get; set; } = new();
}

public sealed class OutletScheduleProductDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
    public Guid? WeightVariantId { get; set; }
    public string? WeightVariantLabel { get; set; }
}
