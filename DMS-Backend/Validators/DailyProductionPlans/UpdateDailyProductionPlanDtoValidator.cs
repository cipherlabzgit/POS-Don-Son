using DMS_Backend.Models.DTOs.DailyProductionPlans;
using FluentValidation;

namespace DMS_Backend.Validators.DailyProductionPlans;

public class UpdateDailyProductionPlanDtoValidator : AbstractValidator<UpdateDailyProductionPlanDto>
{
    public UpdateDailyProductionPlanDtoValidator()
    {
        RuleFor(x => x.PlanDate)
            .NotEmpty().WithMessage("Plan date is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.PlannedQty)
            .GreaterThan(0).WithMessage("Planned quantity must be greater than 0");

        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("Priority is required")
            .Must(priority => priority == "Low" || priority == "Medium" || priority == "High")
            .WithMessage("Priority must be Low, Medium, or High");
    }
}
