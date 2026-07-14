using FluentValidation;
using DMS_Backend.Models.DTOs.SectionConsumables;

namespace DMS_Backend.Validators.SectionConsumables;

public sealed class UpdateSectionConsumableValidator : AbstractValidator<UpdateSectionConsumableDto>
{
    public UpdateSectionConsumableValidator()
    {
        RuleFor(x => x.ProductionSectionId)
            .NotEmpty().WithMessage("Production section is required");

        RuleFor(x => x.IngredientId)
            .NotEmpty().WithMessage("Ingredient is required");

        RuleFor(x => x.QuantityPerUnit)
            .GreaterThan(0).WithMessage("Quantity per unit must be greater than 0");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
    }
}
