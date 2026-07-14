using FluentValidation;
using DMS_Backend.Models.DTOs.DeliveryPlans;

namespace DMS_Backend.Validators.DeliveryPlans;

public sealed class UpdateDeliveryPlanValidator : AbstractValidator<UpdateDeliveryPlanDto>
{
    public UpdateDeliveryPlanValidator()
    {
        RuleFor(x => x.PlanDate)
            .NotEmpty().WithMessage("Plan date is required");

        RuleFor(x => x.DeliveryTurnId)
            .NotEmpty().WithMessage("Delivery turn is required");

        RuleFor(x => x.DayTypeId)
            .NotEmpty().WithMessage("Day type is required");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters");
    }
}
