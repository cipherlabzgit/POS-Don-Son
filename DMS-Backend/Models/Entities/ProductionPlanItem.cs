using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.Entities;

public class ProductionPlanItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProductionPlanId { get; set; }

    [Required]
    public Guid ProductionSectionId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    public decimal RegularFullQty { get; set; }

    public decimal RegularMiniQty { get; set; }

    public decimal CustomizedFullQty { get; set; }

    public decimal CustomizedMiniQty { get; set; }

    public decimal FreezerStock { get; set; }

    public decimal ProduceQty { get; set; }

    public bool IsExcluded { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ProductionPlan? ProductionPlan { get; set; }
    public virtual ProductionSection? ProductionSection { get; set; }
    public virtual Product? Product { get; set; }
    public virtual ICollection<ProductionAdjustment> ProductionAdjustments { get; set; } = new List<ProductionAdjustment>();
}
