namespace DMS_Backend.Models.DTOs.RoundingRules;

public class RoundingRuleDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AppliesTo { get; set; } = string.Empty;
    public string RoundingMethod { get; set; } = "Nearest";
    public int DecimalPlaces { get; set; } = 2;
    public decimal RoundingIncrement { get; set; } = 1;
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public decimal? RatioBaseQuantity { get; set; }
    public decimal? RatioYieldQuantity { get; set; }
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
