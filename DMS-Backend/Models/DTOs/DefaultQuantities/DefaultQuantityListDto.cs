namespace DMS_Backend.Models.DTOs.DefaultQuantities;

public sealed class DefaultQuantityListDto
{
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public Guid DayTypeId { get; set; }
    public string DayTypeName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
    public DateTime UpdatedAt { get; set; }
}
