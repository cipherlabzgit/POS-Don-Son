using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.Reconciliations;

public class ReconciliationDetailDto
{
    public Guid Id { get; set; }
    public string ReconciliationNo { get; set; } = string.Empty;
    public DateTime ReconciliationDate { get; set; }
    public Guid DeliveryPlanId { get; set; }
    public string DeliveryPlanName { get; set; } = string.Empty;
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public ReconciliationStatus Status { get; set; }
    public Guid? SubmittedBy { get; set; }
    public string SubmittedByName { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ReconciliationItemDto> Items { get; set; } = new();
}
