using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionSections;

namespace DMS_Backend.Validators.ProductionSections;

public sealed class CreateProductionSectionValidator : AbstractValidator<CreateProductionSectionDto>
{
    public CreateProductionSectionValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(20).WithMessage("Code cannot exceed 20 characters")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, hyphens, and underscores");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Location)
            .MaximumLength(100).WithMessage("Location cannot exceed 100 characters");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).When(x => x.Capacity.HasValue)
            .WithMessage("Capacity must be greater than 0");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");
    }
}
