using FluentValidation;
using DMS_Backend.Models.DTOs.DeliveryTurns;

namespace DMS_Backend.Validators.DeliveryTurns;

public sealed class UpdateDeliveryTurnValidator : AbstractValidator<UpdateDeliveryTurnDto>
{
    public UpdateDeliveryTurnValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(20).WithMessage("Code cannot exceed 20 characters")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, hyphens, and underscores");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(50).WithMessage("Name cannot exceed 50 characters");

        RuleFor(x => x.Description)
            .MaximumLength(200).WithMessage("Description cannot exceed 200 characters");

        RuleFor(x => x.Time)
            .NotEmpty().WithMessage("Time is required");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");
    }
}
