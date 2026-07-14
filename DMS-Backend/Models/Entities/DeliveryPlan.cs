using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Represents a delivery plan header for a specific date and turn.
/// Contains metadata and configuration for the plan, with line items in DeliveryPlanItem.
/// </summary>
[Table("delivery_plans")]
public class DeliveryPlan : BaseEntity
{
    /// <summary>
    /// Unique plan number (e.g., "DP-2024-001").
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("plan_no")]
    public string PlanNo { get; set; } = string.Empty;

    /// <summary>
    /// The date this delivery plan is for.
    /// </summary>
    [Required]
    [Column("plan_date")]
    public DateTime PlanDate { get; set; }

    /// <summary>
    /// The delivery turn this plan is for.
    /// </summary>
    [Required]
    [Column("delivery_turn_id")]
    public Guid DeliveryTurnId { get; set; }

    /// <summary>
    /// The day type for this plan (Weekday, Saturday, etc.).
    /// </summary>
    [Required]
    [Column("day_type_id")]
    public Guid DayTypeId { get; set; }

    /// <summary>
    /// Current status of the delivery plan.
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// Whether to use freezer stock for this plan.
    /// </summary>
    [Column("use_freezer_stock")]
    public bool UseFreezerStock { get; set; } = false;

    /// <summary>
    /// Array of outlet IDs to exclude from this plan (stored as JSONB).
    /// </summary>
    [Column("excluded_outlets", TypeName = "jsonb")]
    public List<Guid>? ExcludedOutlets { get; set; }

    /// <summary>
    /// Array of product IDs to exclude from this plan (stored as JSONB).
    /// </summary>
    [Column("excluded_products", TypeName = "jsonb")]
    public List<Guid>? ExcludedProducts { get; set; }

    /// <summary>
    /// Additional notes or comments for the plan.
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Optional recipe plan to use when computing ingredient totals for this delivery plan.
    /// </summary>
    [Column("recipe_plan_id")]
    public Guid? RecipePlanId { get; set; }

    // Navigation properties
    public DeliveryTurn? DeliveryTurn { get; set; }
    public DayType? DayType { get; set; }
    public RecipePlan? RecipePlan { get; set; }
    public ICollection<DeliveryPlanItem> DeliveryPlanItems { get; set; } = new List<DeliveryPlanItem>();
}
