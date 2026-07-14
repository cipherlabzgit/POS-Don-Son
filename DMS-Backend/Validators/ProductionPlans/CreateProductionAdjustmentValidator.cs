using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionPlans;

namespace DMS_Backend.Validators.ProductionPlans;

public class CreateProductionAdjustmentValidator : AbstractValidator<CreateProductionAdjustmentDto>
{
    public CreateProductionAdjustmentValidator()
    {
        RuleFor(x => x.ProductionPlanItemId)
            .NotEmpty().WithMessage("Production plan item ID is required");

        RuleFor(x => x.AdjustmentQty)
            .NotEqual(0).WithMessage("Adjustment quantity cannot be zero");

        RuleFor(x => x.AdjustedBy)
            .NotEmpty().WithMessage("Adjusted by user ID is required");

        When(x => !string.IsNullOrWhiteSpace(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");
        });
    }
}
