using DMS_Backend.Models.DTOs.PriceLists;
using FluentValidation;

namespace DMS_Backend.Validators.PriceLists;

public class PriceListCreateDtoValidator : AbstractValidator<PriceListCreateDto>
{
    public PriceListCreateDtoValidator()
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

        RuleFor(x => x.PriceListType)
            .MaximumLength(50).WithMessage("PriceListType must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.PriceListType));

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required")
            .MaximumLength(3).WithMessage("Currency must be a 3-letter code");

        RuleFor(x => x.EffectiveFrom)
            .NotEmpty().WithMessage("EffectiveFrom is required");

        RuleFor(x => x.EffectiveTo)
            .GreaterThan(x => x.EffectiveFrom).WithMessage("EffectiveTo must be after EffectiveFrom")
            .When(x => x.EffectiveTo.HasValue);
    }
}
