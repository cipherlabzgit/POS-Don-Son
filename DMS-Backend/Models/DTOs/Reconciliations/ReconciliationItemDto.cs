using DMS_Backend.Models.Entities;

namespace DMS_Backend.Models.DTOs.Reconciliations;

public class ReconciliationItemDto
{
    public Guid Id { get; set; }
    public Guid ReconciliationId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal ExpectedQty { get; set; }
    public decimal ActualQty { get; set; }
    public decimal VarianceQty { get; set; }
    public VarianceType VarianceType { get; set; }
    public string? Reason { get; set; }
}
