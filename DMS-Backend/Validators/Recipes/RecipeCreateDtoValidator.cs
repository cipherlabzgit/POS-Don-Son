using DMS_Backend.Models.DTOs.Recipes;
using FluentValidation;

namespace DMS_Backend.Validators.Recipes;

public class RecipeCreateDtoValidator : AbstractValidator<RecipeCreateDto>
{
    public RecipeCreateDtoValidator()
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

public class RecipeComponentDtoValidator : AbstractValidator<RecipeComponentDto>
{
    public RecipeComponentDtoValidator()
    {
        RuleFor(x => x.ProductionSectionId)
            .NotEmpty().WithMessage("ProductionSectionId is required");

        RuleFor(x => x.ComponentName)
            .NotEmpty().WithMessage("ComponentName is required")
            .MaximumLength(200).WithMessage("ComponentName must not exceed 200 characters");

        RuleFor(x => x.PercentageOfBase)
            .GreaterThan(0).WithMessage("PercentageOfBase must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("PercentageOfBase cannot exceed 100")
            .When(x => x.IsPercentageBased && x.PercentageOfBase.HasValue);

        RuleFor(x => x.BaseRecipeId)
            .NotEmpty().WithMessage("BaseRecipeId is required when IsPercentageBased is true")
            .When(x => x.IsPercentageBased);

        RuleFor(x => x.RecipeIngredients)
            .NotEmpty().WithMessage("At least one ingredient is required");

        RuleForEach(x => x.RecipeIngredients).SetValidator(new RecipeIngredientDtoValidator());
    }
}

public class RecipeIngredientDtoValidator : AbstractValidator<RecipeIngredientDto>
{
    public RecipeIngredientDtoValidator()
    {
        RuleFor(x => x.IngredientId)
            .NotEmpty().WithMessage("IngredientId is required");

        RuleFor(x => x.QtyPerUnit)
            .GreaterThanOrEqualTo(0).WithMessage("QtyPerUnit must be greater than or equal to 0");

        RuleFor(x => x.ExtraQtyPerUnit)
            .GreaterThanOrEqualTo(0).WithMessage("ExtraQtyPerUnit must be greater than or equal to 0");

        RuleFor(x => x.PercentageValue)
            .GreaterThan(0).WithMessage("PercentageValue must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("PercentageValue cannot exceed 100")
            .When(x => x.IsPercentage && x.PercentageValue.HasValue);

        RuleFor(x => x.PercentageSourceProductId)
            .NotEmpty().WithMessage("PercentageSourceProductId is required when IsPercentage is true")
            .When(x => x.IsPercentage);
    }
}
