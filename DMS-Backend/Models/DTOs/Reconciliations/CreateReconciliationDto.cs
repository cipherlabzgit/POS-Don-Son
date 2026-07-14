namespace DMS_Backend.Models.DTOs.Reconciliations;

public class CreateReconciliationDto
{
    public DateTime ReconciliationDate { get; set; }
    public Guid DeliveryPlanId { get; set; }
    public Guid OutletId { get; set; }
}
