using DMS_Backend.Models.DTOs.Recipes;
using FluentValidation;

namespace DMS_Backend.Validators.Recipes;

public class RecipeUpdateDtoValidator : AbstractValidator<RecipeUpdateDto>
{
    public RecipeUpdateDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("ProductId is required");

        RuleFor(x => x.Version)
            .GreaterThan(0).WithMessage("Version must be greater than 0");

        RuleFor(x => x.EffectiveFrom)
            .NotEmpty().WithMessage("EffectiveFrom is required");

        RuleFor(x => x.EffectiveTo)
            .GreaterThan(x => x.EffectiveFrom).WithMessage("EffectiveTo must be after EffectiveFrom")
            .When(x => x.EffectiveTo.HasValue);

        RuleFor(x => x.RoundOffValue)
            .GreaterThan(0).WithMessage("RoundOffValue must be greater than 0")
            .When(x => x.ApplyRoundOff && x.RoundOffValue.HasValue);

        RuleFor(x => x.RoundOffNotes)
            .MaximumLength(500).WithMessage("RoundOffNotes must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.RoundOffNotes));

        RuleFor(x => x.RecipeComponents)
            .NotEmpty().WithMessage("At least one component is required");

        RuleForEach(x => x.RecipeComponents).SetValidator(new RecipeComponentDtoValidator());
    }
}
