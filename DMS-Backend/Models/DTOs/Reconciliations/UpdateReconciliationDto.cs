using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.Reconciliations;

public class UpdateReconciliationDto
{
    public DateTime? ReconciliationDate { get; set; }
    public ReconciliationStatus? Status { get; set; }
}
