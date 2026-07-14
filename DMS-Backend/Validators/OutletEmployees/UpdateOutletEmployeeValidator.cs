using FluentValidation;
using DMS_Backend.Models.DTOs.OutletEmployees;

namespace DMS_Backend.Validators.OutletEmployees;

public sealed class UpdateOutletEmployeeValidator : AbstractValidator<UpdateOutletEmployeeDto>
{
    public UpdateOutletEmployeeValidator()
    {
        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User is required");

        RuleFor(x => x.Designation)
            .MaximumLength(50).WithMessage("Designation cannot exceed 50 characters");

        RuleFor(x => x.HireDate)
            .NotNull().WithMessage("Hire date is required");

        RuleFor(x => x.HireDate)
            .LessThanOrEqualTo(DateTime.UtcNow)
            .When(x => x.HireDate.HasValue)
            .WithMessage("Hire date cannot be in the future");

        RuleFor(x => x.TerminationDate)
            .GreaterThanOrEqualTo(x => x.HireDate!.Value).When(x => x.TerminationDate.HasValue && x.HireDate.HasValue)
            .WithMessage("Termination date must be on or after hire date");
    }
}
