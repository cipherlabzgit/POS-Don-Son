using DMS_Backend.Models.DTOs.Outlets;
using FluentValidation;

namespace DMS_Backend.Validators.Outlets;

public class UpdateOutletDtoValidator : AbstractValidator<UpdateOutletDto>
{
    public UpdateOutletDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(20).WithMessage("Code must not exceed 20 characters")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, underscores, or hyphens");

        RuleFor(x => x.PosVerificationCode)
            .MinimumLength(8).WithMessage("POS Verification Code must be at least 8 characters")
            .MaximumLength(40).WithMessage("POS Verification Code must not exceed 40 characters")
            .Matches(@"^[A-Za-z0-9#@$%_\-]+$").WithMessage("POS Verification Code may contain letters, numbers, and # @ $ % _ -")
            .Must((dto, code) => !string.Equals(code?.Trim(), dto.Code?.Trim(), StringComparison.OrdinalIgnoreCase))
            .WithMessage("POS Verification Code cannot be the same as the showroom Code")
            .When(x => !string.IsNullOrWhiteSpace(x.PosVerificationCode));

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address must not exceed 200 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Phone must not exceed 20 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson));

        RuleFor(x => x.LocationType)
            .MaximumLength(50).WithMessage("Location type must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.LocationType));

        RuleFor(x => x.OperatingHours)
            .MaximumLength(100).WithMessage("Operating hours must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.OperatingHours));

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be non-negative");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180")
            .When(x => x.Longitude.HasValue);
    }
}
