using FluentValidation;
using DMS_Backend.Models.DTOs.DayTypes;

namespace DMS_Backend.Validators.DayTypes;

public sealed class UpdateDayTypeValidator : AbstractValidator<UpdateDayTypeDto>
{
    public UpdateDayTypeValidator()
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

        RuleFor(x => x.Multiplier)
            .GreaterThan(0).WithMessage("Multiplier must be greater than 0")
            .LessThanOrEqualTo(10).WithMessage("Multiplier cannot exceed 10");

        RuleFor(x => x.Color)
            .MaximumLength(7).WithMessage("Color cannot exceed 7 characters")
            .Matches(@"^#[0-9A-Fa-f]{6}$").When(x => !string.IsNullOrEmpty(x.Color))
            .WithMessage("Color must be a valid hex color code (e.g., #FF5733)");
    }
}
