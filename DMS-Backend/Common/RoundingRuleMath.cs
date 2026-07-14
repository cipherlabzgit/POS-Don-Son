namespace DMS_Backend.Common;

/// <summary>
/// Increment-based rounding used by rounding rules (Nearest / Up / Down).
/// </summary>
public static class RoundingRuleMath
{
    public static decimal Round(
        decimal rawValue,
        string roundingMethod,
        decimal roundingIncrement,
        int decimalPlaces)
    {
        if (roundingIncrement <= 0)
            throw new ArgumentOutOfRangeException(nameof(roundingIncrement), "Rounding increment must be greater than zero.");

        var scaled = rawValue / roundingIncrement;
        var roundedScaled = roundingMethod?.Trim() switch
        {
            "Up" => Math.Ceiling(scaled),
            "Down" => Math.Floor(scaled),
            "Nearest" => Math.Round(scaled, MidpointRounding.AwayFromZero),
            _ => Math.Round(scaled, MidpointRounding.AwayFromZero)
        };

        var result = roundedScaled * roundingIncrement;
        return Math.Round(result, decimalPlaces, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Item-level standard quantity: e.g. patties × (yield / base) → eggs before rounding.
    /// </summary>
    public static decimal ComputeStandardFromRatio(decimal itemQuantity, decimal ratioBaseQuantity, decimal ratioYieldQuantity)
    {
        if (ratioBaseQuantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(ratioBaseQuantity), "Ratio base must be greater than zero.");
        return itemQuantity * (ratioYieldQuantity / ratioBaseQuantity);
    }
}
