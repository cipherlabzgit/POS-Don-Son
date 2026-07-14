namespace DMS_Backend.Models.DTOs.OutletEmployees;

public sealed class OutletEmployeeListDto
{
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string OutletCode { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    public string? Position { get; set; }
    public string? Designation { get; set; }
    public bool IsManager { get; set; }
    public bool CanReceiveDeliveries { get; set; }
    public DateTime? HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
