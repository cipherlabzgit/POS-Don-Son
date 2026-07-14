using FluentValidation;
using DMS_Backend.Models.DTOs.Reconciliations;

namespace DMS_Backend.Validators.Reconciliations;

public class CreateReconciliationValidator : AbstractValidator<CreateReconciliationDto>
{
    public CreateReconciliationValidator()
    {
        RuleFor(x => x.ReconciliationDate)
            .NotEmpty().WithMessage("Reconciliation date is required");

        RuleFor(x => x.DeliveryPlanId)
            .NotEmpty().WithMessage("Delivery plan ID is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet ID is required");
    }
}
