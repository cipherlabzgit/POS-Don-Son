namespace DMS_Backend.Models.DTOs.DefaultQuantities;

public sealed class UpdateDefaultQuantityDto
{
    public decimal FullQuantity { get; set; } = 0;
    public decimal MiniQuantity { get; set; } = 0;
}
