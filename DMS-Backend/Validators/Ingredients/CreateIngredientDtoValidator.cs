using DMS_Backend.Models.DTOs.Ingredients;
using FluentValidation;

namespace DMS_Backend.Validators.Ingredients;

public class CreateIngredientDtoValidator : AbstractValidator<CreateIngredientDto>
{
    public CreateIngredientDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Ingredient code is required")
            .MaximumLength(20).WithMessage("Ingredient code must not exceed 20 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ingredient name is required")
            .MaximumLength(200).WithMessage("Ingredient name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required");

        RuleFor(x => x.UnitOfMeasureId)
            .NotEmpty().WithMessage("Unit of measure is required");

        RuleFor(x => x.IngredientType)
            .NotEmpty().WithMessage("Ingredient type is required")
            .Must(x => x == "Raw" || x == "Semi-Finished")
            .WithMessage("Ingredient type must be either 'Raw' or 'Semi-Finished'");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price must be greater than or equal to 0");

        RuleFor(x => x.ExtraPercentage)
            .GreaterThanOrEqualTo(0).WithMessage("Extra percentage must be greater than or equal to 0")
            .When(x => x.ExtraPercentageApplicable);

        RuleFor(x => x.DecimalPlaces)
            .InclusiveBetween(0, 4).WithMessage("Decimal places must be between 0 and 4")
            .When(x => x.AllowDecimal);
    }
}
