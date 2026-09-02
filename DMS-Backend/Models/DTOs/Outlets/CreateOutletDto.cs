namespace DMS_Backend.Models.DTOs.Outlets;

public sealed class CreateOutletDto
{
    public required string Code { get; set; }
    public string? PosVerificationCode { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? ContactPerson { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public string? LocationType { get; set; }
    public bool HasVariants { get; set; } = true;
    public bool IsDeliveryPoint { get; set; } = true;
    public Guid? DefaultDeliveryTurnId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? OperatingHours { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ShowInDashboard { get; set; } = true;
}
