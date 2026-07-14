using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public class ProductionAdjustment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProductionPlanItemId { get; set; }

    public decimal AdjustmentQty { get; set; }

    [StringLength(500)]
    public string? Reason { get; set; }

    [Required]
    public Guid AdjustedBy { get; set; }

    [Required]
    public DateTime AdjustedAt { get; set; } = DateTime.UtcNow;

    public virtual ProductionPlanItem? ProductionPlanItem { get; set; }
}
