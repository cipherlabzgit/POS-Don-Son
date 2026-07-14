using DMS_Backend.Models.DTOs.RoundingRules;
using FluentValidation;

namespace DMS_Backend.Validators.RoundingRules;

public class RoundingRulePreviewRequestDtoValidator : AbstractValidator<RoundingRulePreviewRequestDto>
{
    public RoundingRulePreviewRequestDtoValidator()
    {
        RuleFor(x => x.RoundingMethod)
            .NotEmpty().WithMessage("RoundingMethod is required");

        RuleFor(x => x.RoundingIncrement)
            .GreaterThan(0).WithMessage("RoundingIncrement must be greater than zero");

        RuleFor(x => x.DecimalPlaces)
            .GreaterThanOrEqualTo(0).WithMessage("DecimalPlaces must be 0 or greater");

        RuleFor(x => x)
            .Must(x => !(x.RatioBaseQuantity.HasValue ^ x.RatioYieldQuantity.HasValue))
            .WithMessage("Ratio base and yield must both be provided or both omitted.");

        When(x => x.RatioBaseQuantity.HasValue && x.RatioYieldQuantity.HasValue, () =>
        {
            RuleFor(x => x.RatioBaseQuantity!)
                .GreaterThan(0).WithMessage("Ratio base must be greater than zero");

            RuleFor(x => x.RatioYieldQuantity!)
                .GreaterThanOrEqualTo(0).WithMessage("Ratio yield must be zero or greater");

            RuleFor(x => x.SampleItemQuantity)
                .NotNull().WithMessage("Sample item quantity is required when an item-level ratio is set.");
        }).Otherwise(() =>
        {
            RuleFor(x => x.SampleStandardValue)
                .NotNull().WithMessage("Sample standard value is required when no ratio is configured.");
        });
    }
}
