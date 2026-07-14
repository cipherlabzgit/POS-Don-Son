using FluentValidation;
using DMS_Backend.Models.DTOs.Outlets;

namespace DMS_Backend.Validators.Outlets;

public sealed class UpdateOutletValidator : AbstractValidator<UpdateOutletDto>
{
    public UpdateOutletValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Outlet code is required")
            .MaximumLength(20).WithMessage("Code cannot exceed 20 characters")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, hyphens, and underscores");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Outlet name is required")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Phone cannot exceed 20 characters");

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name cannot exceed 100 characters");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");

        RuleFor(x => x.LocationType)
            .MaximumLength(50).WithMessage("Location type cannot exceed 50 characters");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180");

        RuleFor(x => x.OperatingHours)
            .MaximumLength(100).WithMessage("Operating hours cannot exceed 100 characters");
    }
}
