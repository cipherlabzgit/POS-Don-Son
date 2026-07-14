namespace DMS_Backend.Models.DTOs.Outlets;

public class OutletListItemDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ContactPerson { get; set; }
    public int DisplayOrder { get; set; }
    public string? LocationType { get; set; }
    public bool IsActive { get; set; }
}
