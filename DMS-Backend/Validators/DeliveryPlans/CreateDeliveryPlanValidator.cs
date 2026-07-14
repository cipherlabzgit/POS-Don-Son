using FluentValidation;
using DMS_Backend.Models.DTOs.DeliveryPlans;

namespace DMS_Backend.Validators.DeliveryPlans;

public sealed class CreateDeliveryPlanValidator : AbstractValidator<CreateDeliveryPlanDto>
{
    public CreateDeliveryPlanValidator()
    {
        RuleFor(x => x.PlanNo)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.PlanNo))
            .WithMessage("Plan number cannot exceed 50 characters");

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
