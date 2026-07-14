using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public enum ProductionPlanStatus
{
    Draft,
    Finalized,
    InProduction,
    Completed,
    Pending,
}

public class ProductionPlan
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid DeliveryPlanId { get; set; }

    [Required]
    public DateTime ComputedDate { get; set; }

    [Required]
    public ProductionPlanStatus Status { get; set; } = ProductionPlanStatus.Draft;

    public bool UseFreezerStock { get; set; }

    public int TotalProducts { get; set; }

    public decimal TotalQuantity { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual DeliveryPlan? DeliveryPlan { get; set; }
    public virtual ICollection<ProductionPlanItem> ProductionPlanItems { get; set; } = new List<ProductionPlanItem>();
}
