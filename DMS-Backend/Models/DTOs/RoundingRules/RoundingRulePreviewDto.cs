namespace DMS_Backend.Models.DTOs.RoundingRules;

public class RoundingRulePreviewRequestDto
{
    public string RoundingMethod { get; set; } = "Nearest";
    public int DecimalPlaces { get; set; } = 2;
    public decimal RoundingIncrement { get; set; } = 1;
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    /// <summary>Optional item-level ratio: e.g. base 4 patties, yield 1 egg.</summary>
    public decimal? RatioBaseQuantity { get; set; }
    public decimal? RatioYieldQuantity { get; set; }
    /// <summary>Primary item count when ratio is set (e.g. number of patties).</summary>
    public decimal? SampleItemQuantity { get; set; }
    /// <summary>Direct standard value when no ratio is configured.</summary>
    public decimal? SampleStandardValue { get; set; }
}

public class RoundingRulePreviewResponseDto
{
    public decimal StandardValue { get; set; }
    public decimal RoundedValue { get; set; }
}
