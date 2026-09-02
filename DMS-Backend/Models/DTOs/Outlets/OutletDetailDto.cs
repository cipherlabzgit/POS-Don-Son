namespace DMS_Backend.Models.DTOs.Outlets;

public sealed class OutletDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? PosVerificationCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ContactPerson { get; set; }
    public int DisplayOrder { get; set; }
    public string? LocationType { get; set; }
    public bool HasVariants { get; set; }
    public bool IsDeliveryPoint { get; set; }
    public Guid? DefaultDeliveryTurnId { get; set; }
    public string? DefaultDeliveryTurnName { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? OperatingHours { get; set; }
    public string? Notes { get; set; }
    public int EmployeeCount { get; set; }
    public bool IsActive { get; set; }
    public bool ShowInDashboard { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
