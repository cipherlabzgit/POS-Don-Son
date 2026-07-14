using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public enum VarianceType
{
    Match,
    Shortage,
    Excess
}

public class ReconciliationItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ReconciliationId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    public decimal ExpectedQty { get; set; }

    public decimal ActualQty { get; set; }

    public decimal VarianceQty { get; set; }

    [Required]
    public VarianceType VarianceType { get; set; } = VarianceType.Match;

    [StringLength(500)]
    public string? Reason { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual Reconciliation? Reconciliation { get; set; }
    public virtual Product? Product { get; set; }
}
