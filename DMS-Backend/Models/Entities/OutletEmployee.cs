using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents an employee assigned to a showroom/outlet.
/// Used for showroom employee management and access control.
/// </summary>
[Table("outlet_employees")]
public class OutletEmployee : BaseEntity
{
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("employee_code")]
    public string EmployeeCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("full_name")]
    public string? FullName { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [MaxLength(50)]
    [Column("position")]
    public string? Position { get; set; }

    /// <summary>
    /// Employment start date.
    /// </summary>
    [Column("hire_date")]
    public DateTime? HireDate { get; set; }

    /// <summary>
    /// Employment end date (for tracking former employees).
    /// </summary>
    [Column("termination_date")]
    public DateTime? TerminationDate { get; set; }

    /// <summary>
    /// Whether this employee has manager/supervisor role.
    /// </summary>
    [Column("is_manager")]
    public bool IsManager { get; set; } = false;

    /// <summary>
    /// Whether this employee can receive deliveries.
    /// </summary>
    [Column("can_receive_deliveries")]
    public bool CanReceiveDeliveries { get; set; } = true;

    /// <summary>
    /// Notes about the employee.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("OutletId")]
    public virtual Outlet Outlet { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
