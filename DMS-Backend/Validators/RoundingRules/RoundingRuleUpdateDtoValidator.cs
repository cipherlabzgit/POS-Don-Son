using DMS_Backend.Models.DTOs.RoundingRules;
using FluentValidation;

namespace DMS_Backend.Validators.RoundingRules;

public class RoundingRuleUpdateDtoValidator : AbstractValidator<RoundingRuleUpdateDto>
{
    public RoundingRuleUpdateDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(50).WithMessage("Code must not exceed 50 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.AppliesTo)
            .NotEmpty().WithMessage("AppliesTo is required")
            .MaximumLength(50).WithMessage("AppliesTo must not exceed 50 characters");

        RuleFor(x => x.RoundingMethod)
            .NotEmpty().WithMessage("RoundingMethod is required")
            .MaximumLength(50).WithMessage("RoundingMethod must not exceed 50 characters");

        RuleFor(x => x.DecimalPlaces)
            .GreaterThanOrEqualTo(0).WithMessage("DecimalPlaces must be 0 or greater");

        RuleFor(x => x.RoundingIncrement)
            .GreaterThan(0).WithMessage("RoundingIncrement must be greater than 0");

        RuleFor(x => x)
            .Must(x => !(x.RatioBaseQuantity.HasValue ^ x.RatioYieldQuantity.HasValue))
            .WithMessage("Ratio base and yield must both be set or both omitted.");

        RuleFor(x => x.RatioBaseQuantity)
            .GreaterThan(0)
            .When(x => x.RatioBaseQuantity.HasValue)
            .WithMessage("Ratio base must be greater than zero");

        RuleFor(x => x.RatioYieldQuantity)
            .GreaterThanOrEqualTo(0)
            .When(x => x.RatioYieldQuantity.HasValue)
            .WithMessage("Ratio yield must be zero or greater");
    }
}
