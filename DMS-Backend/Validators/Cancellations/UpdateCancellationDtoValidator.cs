using DMS_Backend.Models.DTOs.Cancellations;
using FluentValidation;

namespace DMS_Backend.Validators.Cancellations;

public class UpdateCancellationDtoValidator : AbstractValidator<UpdateCancellationDto>
{
    public UpdateCancellationDtoValidator()
    {
        RuleFor(x => x.CancellationDate)
            .NotEmpty().WithMessage("Cancellation date is required");

        RuleFor(x => x.DeliveryNo)
            .NotEmpty().WithMessage("Delivery number is required")
            .MaximumLength(50).WithMessage("Delivery number must not exceed 50 characters");

        RuleFor(x => x.DeliveredDate)
            .NotEmpty().WithMessage("Delivered date is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}
