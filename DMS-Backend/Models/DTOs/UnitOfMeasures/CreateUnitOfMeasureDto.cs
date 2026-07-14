namespace DMS_Backend.Models.DTOs.UnitOfMeasures;

public class CreateUnitOfMeasureDto
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
