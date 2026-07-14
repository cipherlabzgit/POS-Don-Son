using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.OutletEmployees;

public sealed class CreateOutletEmployeeDto
{
    public required Guid OutletId { get; set; }
    public Guid? UserId { get; set; }

    [Required, MaxLength(100)]
    public required string EmployeeCode { get; set; }

    [Required, MaxLength(100)]
    public required string FirstName { get; set; }

    [Required, MaxLength(100)]
    public required string LastName { get; set; }

    [MaxLength(200)]
    public string? FullName { get; set; }

    [Required, MaxLength(100)]
    public required string Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; }

    public string? Designation { get; set; }
    public bool IsManager { get; set; } = false;
    public bool CanReceiveDeliveries { get; set; } = true;
    public DateTime? HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}
