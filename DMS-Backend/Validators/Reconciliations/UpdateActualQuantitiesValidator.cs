using FluentValidation;
using DMS_Backend.Models.DTOs.Reconciliations;

namespace DMS_Backend.Validators.Reconciliations;

public class UpdateActualQuantitiesValidator : AbstractValidator<UpdateActualQuantitiesDto>
{
    public UpdateActualQuantitiesValidator()
    {
        RuleFor(x => x.Items)
            .NotNull().WithMessage("Items are required")
            .Must(items => items.Count > 0).WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new ActualQuantityItemValidator());
    }
}

public class ActualQuantityItemValidator : AbstractValidator<ActualQuantityItemDto>
{
    public ActualQuantityItemValidator()
    {
        RuleFor(x => x.ItemId)
            .NotEmpty().WithMessage("Item ID is required");

        RuleFor(x => x.ActualQty)
            .GreaterThanOrEqualTo(0).WithMessage("Actual quantity must be non-negative");

        When(x => !string.IsNullOrWhiteSpace(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");
        });
    }
}
